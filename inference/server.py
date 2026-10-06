"""
N-ATLAS self-host inference bridge (Path B).

Loads the official open weights (default NCAIR1/N-ATLaS, Llama-3 8B fine-tune)
with HuggingFace transformers and exposes a minimal OpenAI-compatible endpoint
so the Next.js adapter works UNCHANGED:

    NATLAS_API_BASE_URL=http://<gpu-box>:8000
    NATLAS_LLM_PATH=/v1/chat/completions
    NATLAS_API_KEY=self-hosted   (any non-empty value; no auth enforced here)

Generation settings mirror the official model card:
temperature=0.1, repetition_penalty=1.12, chat template with date string.

Needs a CUDA GPU (~16GB VRAM for fp16). No secrets here — bind to localhost
or put behind auth/VPN; never expose this port to the public internet as-is.
"""
import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

MODEL_ID = os.environ.get("NATLAS_MODEL_ID", "NCAIR1/N-ATLaS")
MAX_INPUT_TOKENS = int(os.environ.get("NATLAS_MAX_INPUT_TOKENS", "7000"))
DEFAULT_MAX_NEW = int(os.environ.get("NATLAS_MAX_NEW_TOKENS", "1000"))

app = FastAPI(title="N-ATLAS self-host bridge")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: Optional[str] = None
    messages: List[ChatMessage]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.1


print(f"Loading {MODEL_ID} ...", flush=True)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto",
)
model.eval()
print(f"Loaded on {model.device}.", flush=True)


def extract_json(text: str) -> str:
    """Return the first {...} JSON block, else the raw text."""
    try:
        json.loads(text)
        return text
    except json.JSONDecodeError:
        pass
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        candidate = m.group(0)
        try:
            json.loads(candidate)
            return candidate
        except json.JSONDecodeError:
            return candidate
    return text


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "model": MODEL_ID,
        "device": str(model.device),
        "cuda": torch.cuda.is_available(),
    }


@app.post("/v1/chat/completions")
def chat(req: ChatRequest) -> Dict[str, Any]:
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages must not be empty")

    today = datetime.now().strftime("%d %b %Y")
    prompt = tokenizer.apply_chat_template(
        [m.model_dump() for m in req.messages],
        add_generation_prompt=True,
        tokenize=False,
        date_string=today,
    )
    inputs = tokenizer(prompt, return_tensors="pt", add_special_tokens=False)
    if inputs["input_ids"].shape[1] > MAX_INPUT_TOKENS:
        raise HTTPException(status_code=400, detail="Prompt exceeds context window.")
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    max_new = req.max_tokens or DEFAULT_MAX_NEW
    temp = req.temperature if req.temperature is not None else 0.1
    with torch.inference_mode():
        out = model.generate(
            **inputs,
            max_new_tokens=max_new,
            use_cache=True,
            repetition_penalty=1.12,
            temperature=temp,
            do_sample=temp > 0,
        )
    new_tokens = out[0][inputs["input_ids"].shape[1]:]
    text = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
    return {"choices": [{"message": {"role": "assistant", "content": extract_json(text)}}]}
