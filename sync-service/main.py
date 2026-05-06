import asyncio
import os
import re
import tempfile
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from typing import Optional

import httpx
import stable_whisper
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from align import align_words

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
SUPABASE_URL     = os.environ.get('VITE_SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY', '')
WHISPER_MODEL    = os.environ.get('WHISPER_MODEL', 'small')
ALLOWED_ORIGINS  = os.environ.get('ALLOWED_ORIGINS',
                    'https://perashapp.com,http://localhost:5173').split(',')

HEBREW_PROMPT = (
    'בְּרֵאשִׁ֖ית בָּרָ֣א אֱלֹהִ֑ים אֵ֥ת הַשָּׁמַ֖יִם וְאֵ֥ת הָאָֽרֶץ׃ '
    'וַיֹּ֤אמֶר יְהֹוָה֙ אֶל־מֹשֶׁ֔ה לֵאמֹֽר׃'
)

executor = ThreadPoolExecutor(max_workers=2)
model = None


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    print(f'Loading stable-ts [{WHISPER_MODEL}] on CPU …')
    model = stable_whisper.load_faster_whisper(
        WHISPER_MODEL, device='cpu', compute_type='int8'
    )
    print('Model ready.')
    yield
    executor.shutdown(wait=False)


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=['POST', 'GET', 'OPTIONS'],
    allow_headers=['Content-Type', 'Authorization'],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
class SyncRequest(BaseModel):
    audioUrl: str
    aliyahRef: Optional[str] = None


def is_allowed_url(url: str) -> bool:
    try:
        from urllib.parse import urlparse
        p = urlparse(url)
        return p.scheme == 'https' and (
            p.hostname.endswith('.supabase.co') or
            p.hostname.endswith('.supabase.in')
        )
    except Exception:
        return False


async def verify_token(token: str) -> bool:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return True  # auth not configured — allow (restrict via ALLOWED_ORIGINS)
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f'{SUPABASE_URL}/auth/v1/user',
            headers={'Authorization': f'Bearer {token}', 'apikey': SUPABASE_ANON_KEY},
            timeout=10.0,
        )
        return r.status_code == 200


async def fetch_sefaria_words(ref: str) -> list[str]:
    url = (
        f'https://www.sefaria.org/api/texts/{ref}'
        '?commentary=0&context=0&pad=0&wrapLinks=0'
    )
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(url, timeout=15.0)
            if not r.is_success:
                return []
            data = r.json()
        he_raw = data.get('he', [])

        def flatten(x):
            if isinstance(x, str):
                return [x] if x.strip() else []
            if isinstance(x, list):
                out = []
                for item in x:
                    out.extend(flatten(item))
                return out
            return []

        verses = flatten(he_raw)
        words = []
        for v in verses:
            text = re.sub(r'<[^>]+>', ' ', v)
            text = re.sub(r'[{(\[][פספס][)}\]]', '', text)
            text = re.sub(r'\s*\|\s*', ' ', text)
            text = text.replace('־', ' ')   # maqaf → space
            text = re.sub(r'\s+', ' ', text).strip()
            words.extend(w for w in text.split() if w)
        return words
    except Exception as e:
        print(f'Sefaria error: {e}')
        return []


def _transcribe(audio_path: str) -> list[dict]:
    result = model.transcribe_stable(
        audio_path,
        language='he',
        word_timestamps=True,
        vad=True,
        initial_prompt=HEBREW_PROMPT,
        verbose=False,
    )
    words = []
    for seg in result.segments:
        for w in (seg.words or []):
            text = w.word.strip()
            if text:
                words.append({'word': text, 'start': round(w.start, 3), 'end': round(w.end, 3)})
    return words


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get('/health')
async def health():
    return {'status': 'ok', 'model': WHISPER_MODEL}


@app.post('/sync')
async def sync(
    req: SyncRequest,
    authorization: Optional[str] = Header(None),
):
    # Auth
    token = (authorization or '').removeprefix('Bearer ').strip()
    if token and not await verify_token(token):
        raise HTTPException(401, 'Unauthorized')

    # SSRF guard
    if not is_allowed_url(req.audioUrl):
        raise HTTPException(400, 'Invalid audio URL')

    # Download audio + fetch Sefaria in parallel
    async def download_audio():
        async with httpx.AsyncClient() as client:
            r = await client.get(req.audioUrl, timeout=120.0, follow_redirects=True)
            r.raise_for_status()
            return r.content

    tasks = [asyncio.create_task(download_audio())]
    if req.aliyahRef:
        tasks.append(asyncio.create_task(fetch_sefaria_words(req.aliyahRef)))

    try:
        results = await asyncio.gather(*tasks, return_exceptions=True)
    except Exception as e:
        raise HTTPException(500, str(e))

    audio_bytes = results[0]
    if isinstance(audio_bytes, Exception):
        raise HTTPException(500, f'Audio download failed: {audio_bytes}')

    sefaria_words: list[str] = results[1] if len(results) > 1 and not isinstance(results[1], Exception) else []

    # Transcribe in thread pool (CPU-bound)
    with tempfile.NamedTemporaryFile(suffix='.audio', delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name

    try:
        loop = asyncio.get_event_loop()
        whisper_words = await loop.run_in_executor(executor, _transcribe, tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    if not whisper_words:
        return {'words': [], 'format': 'v2', 'needs_review': True, 'anchor_pct': 0}

    if not sefaria_words:
        # No reference text — return raw Whisper words (v1 format)
        return {'words': whisper_words}

    aligned, anchor_pct = align_words(whisper_words, sefaria_words)
    needs_review = anchor_pct < 0.4

    print(f'sync: {len(whisper_words)}w whisper / {len(sefaria_words)}w sefaria / '
          f'{round(anchor_pct*100)}% anchors / needs_review={needs_review}')

    return {
        'words': aligned,
        'format': 'v2',
        'needs_review': needs_review,
        'anchor_pct': round(anchor_pct, 3),
    }
