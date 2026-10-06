# N-ATLAS self-host bridge (Path B)

Runs the official open weights (`NCAIR1/N-ATLaS`) on your own GPU and exposes
`POST /v1/chat/completions` (OpenAI-compatible), which the Next.js adapter in
`lib/ai/natlas.ts` already speaks. Use this if hosted N-ATLAS API credentials
are not available before the deadline.

> ASR is NOT covered here — the model card ships text weights only. Voice
> transcription must still use the official N-ATLAS ASR service (PS2 key
> requirement). Ask NAIC/NCAIR for ASR access in parallel.

## Requirements

- NVIDIA GPU with ~16 GB VRAM (8B model in fp16), CUDA drivers
- Python 3.10+, or Docker + NVIDIA Container Toolkit

## Run (bare metal)

```bash
cd inference
pip install -r requirements.txt
pip install torch --index-url https://download.pytorch.org/whl/cu121  # match your CUDA
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```

## Run (docker)

```bash
cd inference
docker build -t natlas-bridge .
docker run --gpus all -p 8000:8000 -e HF_TOKEN=<optional-for-gated-repos> natlas-bridge
```

First boot downloads ~16 GB of weights — allow time and disk.

## Point the app at it

In `n-atlas-studymate/.env.local`:

```env
NATLAS_API_BASE_URL=http://<gpu-box-ip>:8000
NATLAS_LLM_PATH=/v1/chat/completions
NATLAS_API_KEY=self-hosted
NATLAS_LLM_MODEL=NCAIR1/N-ATLaS
```

Restart `npm run dev`, then check `/api/health` (configured: true) and ask a
question on `/study`. The `/integration` call log will show real `llm ok`
entries — that is your genuine-integration evidence.

## Security

Bind to localhost/VPN or add auth in front. This bridge enforces no API key —
never expose port 8000 directly to the internet.
