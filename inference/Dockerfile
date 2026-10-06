# GPU image for the N-ATLAS self-host bridge.
# Needs the NVIDIA Container Toolkit on the host to see the GPU.
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /srv
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt \
 && pip3 install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cu121

COPY server.py .
EXPOSE 8000
CMD ["python3", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
