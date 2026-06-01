#!/usr/bin/env python3
"""
align-audio-hebrew.py — Forced CTC alignment (experimental v3)

Bypasses transcription entirely. Given the exact Sefaria text, a wav2vec2
acoustic model finds when each word occurs in the audio. No "what is said"
decision — only "when does this word occur in time".

This is fundamentally different from Whisper: the text is fixed (from Sefaria),
and the model aligns audio → text, not text → audio.

Requirements:
    pip install whisperx torch torchaudio requests
    ffmpeg must be in PATH

Usage:
    python scripts/align-audio-hebrew.py <audio_file> "<sefaria_ref>"

    <audio_file>   Path to .m4a / .mp3 / .wav
    <sefaria_ref>  Sefaria API ref, e.g. "Genesis.36.1-43" or "Bereishit.36.1-43"

Output (stdout):  JSON with word timestamps (same format as generate-sync.js v2)
Progress (stderr): Step-by-step logs

Example:
    python scripts/align-audio-hebrew.py ~/Desktop/Vayishlach/aliyah7.m4a "Genesis.36.1-43"
    python scripts/align-audio-hebrew.py audio.m4a "Genesis.36.1-43" > result.json
"""

import sys
import json
import re
import subprocess
import tempfile
from pathlib import Path

import requests
import torch
import whisperx


# ---------------------------------------------------------------------------
# Hebrew normalization
# ---------------------------------------------------------------------------

def strip_hebrew_diacritics(text: str) -> str:
    """Remove nikud (U+05B0-U+05C7) and taamim/cantillation (U+0591-U+05AF)."""
    return ''.join(ch for ch in text if not (0x0591 <= ord(ch) <= 0x05C7))


def normalize_hebrew(text: str) -> str:
    """Strip diacritics, HTML tags, and collapse whitespace."""
    text = re.sub(r'<[^>]+>', ' ', text)          # strip HTML
    text = strip_hebrew_diacritics(text)
    text = re.sub(r'[^א-ת\s]', ' ', text)  # keep only Hebrew letters
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ---------------------------------------------------------------------------
# Sefaria
# ---------------------------------------------------------------------------

def fetch_sefaria(ref: str) -> str:
    url = f"https://www.sefaria.org/api/texts/{ref}?lang=he&context=0"
    log(f"GET {url}")
    r = requests.get(url, timeout=20)
    r.raise_for_status()
    data = r.json()

    def flatten(x):
        if isinstance(x, list):
            return ' '.join(flatten(i) for i in x)
        return str(x)

    he_raw = flatten(data.get('he', ''))
    clean = normalize_hebrew(he_raw)
    if not clean:
        raise ValueError(f"No Hebrew text returned for ref: {ref}")
    return clean


# ---------------------------------------------------------------------------
# Audio conversion
# ---------------------------------------------------------------------------

def to_wav_16k(src: Path) -> Path:
    """Convert any audio to mono 16 kHz WAV (required by wav2vec2)."""
    dst = Path(tempfile.mktemp(suffix='.wav'))
    result = subprocess.run(
        ['ffmpeg', '-y', '-i', str(src), '-ar', '16000', '-ac', '1', str(dst)],
        capture_output=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed:\n{result.stderr.decode()}")
    return dst


# ---------------------------------------------------------------------------
# Forced alignment
# ---------------------------------------------------------------------------

def forced_align(audio_path: Path, text: str):
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    log(f"Device: {device}")

    log("Converting audio to WAV 16kHz mono...")
    wav = to_wav_16k(audio_path)
    audio = whisperx.load_audio(str(wav))
    duration = len(audio) / 16000
    words = text.split()
    log(f"Audio: {duration:.1f}s | Words in text: {len(words)}")

    log("Loading Hebrew wav2vec2 alignment model (first run downloads ~1GB)...")
    model_a, metadata = whisperx.load_align_model(language_code='he', device=device)

    # One segment = full audio + exact Sefaria text.
    # WhisperX tokenises the text internally and runs CTC to find each token.
    segments = [{'text': text, 'start': 0.0, 'end': duration}]

    log("Running CTC forced alignment...")
    result = whisperx.align(
        segments, model_a, metadata, audio,
        device=device, return_char_alignments=False
    )

    wav.unlink(missing_ok=True)
    return result.get('word_segments', []), words, duration


# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------

def build_output(word_segments: list, words: list, duration: float) -> dict:
    timestamps = []
    for i, word in enumerate(words):
        seg = word_segments[i] if i < len(word_segments) else {}
        timestamps.append({
            'start': round(seg.get('start', 0.0), 3),
            'end':   round(seg.get('end',   0.0), 3),
            'score': round(seg.get('score', 0.0), 3),
        })

    anchored = sum(1 for t in timestamps if t['score'] >= 0.5)
    anchor_pct = anchored / len(timestamps) if timestamps else 0.0

    log(f"anchor_pct={anchor_pct:.2f} ({anchored}/{len(timestamps)} words confident)")

    return {
        'words':        timestamps,
        'anchor_pct':   round(anchor_pct, 3),
        'needs_review': anchor_pct < 0.4,
        'format':       'v3-forced-align',
        'word_count':   len(timestamps),
        'duration':     round(duration, 2),
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log(msg: str):
    print(msg, file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    audio_path = Path(sys.argv[1]).expanduser().resolve()
    sefaria_ref = sys.argv[2]

    if not audio_path.exists():
        log(f"ERROR: audio file not found: {audio_path}")
        sys.exit(1)

    log(f"=== align-audio-hebrew.py ===")
    log(f"Audio:  {audio_path}")
    log(f"Ref:    {sefaria_ref}")

    text = fetch_sefaria(sefaria_ref)
    log(f"Text ({len(text.split())} words): {text[:80]}...")

    word_segments, words, duration = forced_align(audio_path, text)
    output = build_output(word_segments, words, duration)

    print(json.dumps(output, ensure_ascii=False, indent=2))
    log("Done.")


if __name__ == '__main__':
    main()
