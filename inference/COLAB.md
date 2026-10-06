# Free N-ATLAS server on Google Colab ($0, 0 MB of your data)

Runs the whole genuine N-ATLAS pipeline — LLM (8-bit) + official ASR models —
on a free Colab T4 GPU. All downloads happen inside Google's datacenter; your
own connection only carries the small code and the tunnel URL.

> Colab free limits: sessions idle-timeout and max ~12h. If it sleeps, re-run
> the last two cells and paste the fresh tunnel URL into Vercel. Fine for the
> validation week; not 24/7 infrastructure.

## One-time setup (15 min)

1. Create a free Hugging Face account at huggingface.co/join.
2. Open each model page and click **Agree/Accept** on the terms (gated repos):
   - huggingface.co/NCAIR1/N-ATLaS
   - huggingface.co/NCAIR1/Yoruba-ASR
   - huggingface.co/NCAIR1/Hausa-ASR
   - huggingface.co/NCAIR1/Igbo-ASR
   - huggingface.co/NCAIR1/NigerianAccentedEnglish
3. Create a **read** token: HF Settings → Access Tokens → New token (read role).
   Copy it — Colab needs it once per session.
4. Create a free Colab account (any Google account). No installs on your laptop.

## Run (copy each block into its own Colab cell, in order)

**Cell 1 — GPU check.** Runtime → Change runtime type → T4 GPU → then run:

```python
import torch
print(torch.cuda.is_available(), torch.cuda.get_device_name(0))
# must print: True ... Tesla T4 (or similar)
```

**Cell 2 — install (takes ~10 min, cloud-side):**

```python
!git clone https://github.com/Sawmod001/studymate
%cd studymate/n-atlas-studymate/inference
!pip install -q -r requirements.txt
!pip install -q torch --index-url https://download.pytorch.org/whl/cu121
```

**Cell 3 — start the bridge (first boot downloads weights, ~20-40 min):**

```python
import os
os.environ["HF_TOKEN"] = "paste-your-hf-read-token"  # accepted-terms account
os.environ["NATLAS_LOAD_8BIT"] = "1"                  # fits free T4 15GB
!nohup python -m uvicorn server:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
!sleep 5; curl -s http://localhost:8000/health
```

Watch `server.log` until the LLM + first ASR model finish loading
(`tail -f server.log`). Keep this tab open — closing it can kill the session.

**Cell 4 — public URL for your app (no account needed):**

```python
!curl -s https://api.cloudflared.com 2>/dev/null; echo ok
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
!chmod +x cloudflared
!nohup ./cloudflared tunnel --url http://localhost:8000 > tunnel.log 2>&1 &
!sleep 8; grep -o 'https://[^ ]*trycloudflare.com' tunnel.log | head -1
```

Copy the `https://....trycloudflare.com` URL.

## Point the app at it

Vercel → project → Environment Variables (and local `.env.local` for testing):

```env
NATLAS_API_BASE_URL=https://....trycloudflare.com   # from Cell 4
NATLAS_LLM_PATH=/v1/chat/completions
NATLAS_ASR_PATH=/v1/audio/transcriptions
NATLAS_API_KEY=self-hosted
NATLAS_LLM_MODEL=NCAIR1/N-ATLaS
```

Redeploy (Vercel) / restart dev, then verify:
1. `/api/health` → natlas + asr `configured: true`
2. Ask a Yoruba question by **voice** on `/study` → real transcript + real answer
3. `/integration` → `asr ok` + `llm ok` rows in the call log

## If Colab sleeps or the URL dies

Re-run Cells 3–4 (weights are cached in the session, so it is fast while the
runtime lives; a fresh runtime re-downloads). Paste the new tunnel URL into
Vercel → redeploy. For demo day, start Colab 1h early and keep the tab open.
