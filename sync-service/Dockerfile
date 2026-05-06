FROM python:3.11-slim

WORKDIR /app

# ffmpeg is required by whisper for audio decoding
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the model so the first request isn't slow
# WHISPER_MODEL can be overridden at build time: --build-arg MODEL=medium
ARG MODEL=small
ENV WHISPER_MODEL=${MODEL}
RUN python - <<'EOF'
import stable_whisper, os
m = os.environ.get('WHISPER_MODEL', 'small')
print(f'Downloading model: {m}')
stable_whisper.load_faster_whisper(m, device='cpu', compute_type='int8')
print('Done.')
EOF

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
