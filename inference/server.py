"""
N-ATLAS self-host inference bridge (Path B) — LLM + ASR.

Serves the official open weights so the Next.js adapter works UNCHANGED:

    NATLAS_API_BASE_URL=http://<gpu-box>:8000 (or Colab tunnel URL)
    NATLAS_LLM_PATH=/v1/chat/completions
    NATLAS_ASR_PATH=/v1/audio/transcriptions
    NATLAS_API_KEY=self-hosted   (any non-empty value; no auth enforced here)

Modes (env):
    NATLAS_LOAD_8BIT=1  -> 8-bit LLM for small GPUs (Colab free T4 15GB).
                            Needs bitsandbytes. Default 0 (fp16, ~16GB VRAM).
    NATLAS_ASR_DEVICE=cuda|cpu|auto (default auto)

Endpoints:
    GET  /health
    POST /v1/chat/completions   {model, messages, max_tokens?, temperature?}
    POST /v1/audio/transcriptions  multipart: file + language + model?

Generation settings mirror the official model card:
temperature=0.1, repetition_penalty=1.12, chat template with date string.

No secrets here — bind to localhost or put behind a tunnel/VPN; never expose
this port to the public internet as-is.
"""
import io
import json
import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

import numpy as np
import soundfile as sf
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from scipy.signal import resample_poly
from transformers import (
    AutoModelForCausalLM,
    AutoModelForSpeechSeq2Seq,
    AutoProcessor,
    AutoTokenizer,
    pipeline,
)

MODEL_ID = os.environ.get("NATLAS_MODEL_ID", "NCAIR1/N-ATLaS")
LOAD_8BIT = os.environ.get("NATLAS_LOAD_8BIT", "0") == "1"
MAX_INPUT_TOKENS = int(os.environ.get("NATLAS_MAX_INPUT_TOKENS", "7000"))
DEFAULT_MAX_NEW = int(os.environ.get("NATLAS_MAX_NEW_TOKENS", "1000"))
ASR_DEVICE = os.environ.get("NATLAS_ASR_DEVICE", "auto")

ASR_MODELS = {
    "yo": os.environ.get("NATLAS_ASR_YORUBA_MODEL", "NCAIR1/Yoruba-ASR"),
    "ha": os.environ.get("NATLAS_ASR_HAUSA_MODEL", "NCAIR1/Hausa-ASR"),
    "ig": os.environ.get("NATLAS_ASR_IGBO_MODEL", "NCAIR1/Igbo-ASR"),
    "en": os.environ.get("NATLAS_ASR_ENGLISH_MODEL", "NCAIR1/NigerianAccentedEnglish"),
    "en-NG": os.environ.get("NATLAS_ASR_ENGLISH_MODEL", "NCAIR1/NigerianAccentedEnglish"),
}

app = FastAPI(title="N-ATLAS self-host bridge")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: Optional[str] = None
    messages: List[ChatMessage]
    max_tokens: Optional[int] = None
    temperature: Optional[float] = 0.1


print(f"Loading LLM {MODEL_ID} (8-bit={LOAD_8BIT}) ...", flush=True)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
if LOAD_8BIT:
    llm = AutoModelForCausalLM.from_pretrained(
        MODEL_ID, load_in_8bit=True, device_map="auto"
    )
else:
    llm = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
    )
llm.eval()
print(f"LLM on {llm.device}.", flush=True)

_asr_pipes: Dict[str, Any] = {}


def get_asr(language: str):  # lazy per-language Whisper-small (~244M params each)
    lang = language if language in ASR_MODELS else "en"
    if lang not in _asr_pipes:
        model_id = ASR_MODELS[lang]
        print(f"Loading ASR {model_id} ...", flush=True)
        use_cuda = torch.cuda.is_available() and ASR_DEVICE in ("cuda", "auto")
        _asr_pipes[lang] = pipeline(
            "automatic-speech-recognition",
            model=model_id,
            device=0 if use_cuda else -1,
            torch_dtype=torch.float16 if use_cuda else torch.float32,
        )
        print(f"ASR {lang} ready.", flush=True)
    return _asr_pipes[lang]


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
        "mode_8bit": LOAD_8BIT,
        "device": str(llm.device),
        "cuda": torch.cuda.is_available(),
        "asr_loaded": sorted(_asr_pipes.keys()),
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
    inputs = {k: v.to(llm.device) for k, v in inputs.items()}

    max_new = req.max_tokens or DEFAULT_MAX_NEW
    temp = req.temperature if req.temperature is not None else 0.1
    with torch.inference_mode():
        out = llm.generate(
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


@app.post("/v1/audio/transcriptions")
async def transcribe(
    file: UploadFile = File(...),
    language: str = Form("yo"),
    model: str = Form(""),
) -> Dict[str, Any]:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty audio file.")
    if len(raw) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio too large (25MB cap).")
    try:
        audio, sr = sf.read(io.BytesIO(raw), dtype="float32", always_2d=False)
    except Exception:
        raise HTTPException(status_code=415, detail="Could not decode audio. Send wav/mp3/ogg/webm.")
    if getattr(audio, "ndim", 1) > 1:
        audio = np.mean(audio, axis=-1)
    if sr != 16000:
        audio = resample_poly(audio, 16000, sr).astype(np.float32)

    lang = language if language in ASR_MODELS else "en"
    if model.startswith("NCAIR1/"):
        # Explicit override still must be an official N-ATLAS model.
        ASR_MODELS[lang] = model
        _asr_pipes.pop(lang, None)
    try:
        result = get_asr(lang)(audio, sampling_rate=16000)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"ASR failed: {type(exc).__name__}")
    text = (result.get("text") or "").strip() if isinstance(result, dict) else ""
    if not text:
        raise HTTPException(status_code=502, detail="ASR returned an empty transcript.")
    return {"text": text}


# Re-exported so advanced users can wire processors directly.
__all__ = ["app", "AutoProcessor", "AutoModelForSpeechSeq2Seq"]
