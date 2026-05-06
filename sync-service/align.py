import re

WHISPER_TO_TEXT = {
    'אדוני': 'יהוה',
    'ה': 'יהוה',
    'לומר': 'לאמר',
    'ואומר': 'ויאמר',
}

def strip_heb(s: str) -> str:
    return re.sub(r'[^א-ת]', '', s)

def normalize_word(w: str) -> str:
    stripped = strip_heb(w)
    return strip_heb(WHISPER_TO_TEXT.get(stripped, stripped))

def levenshtein(a: str, b: str) -> int:
    if a == b: return 0
    if not a: return len(b)
    if not b: return len(a)
    prev = list(range(len(b) + 1))
    for ca in a:
        curr = [prev[0] + 1]
        for j, cb in enumerate(b):
            curr.append(prev[j] if ca == cb else 1 + min(prev[j + 1], curr[j], prev[j]))
        prev = curr
    return prev[-1]

def align_words(whisper_words: list[dict], sefaria_words: list[str]) -> tuple[list[dict], float]:
    wn = [normalize_word(w['word']) for w in whisper_words]
    sn = [strip_heb(w) for w in sefaria_words]
    w_len, s_len = len(wn), len(sn)

    if not w_len or not s_len:
        return [], 0.0

    WINDOW = 10
    anchors = [{'wi': 0, 'si': 0}]
    s_start = 0

    for wi in range(w_len):
        if not wn[wi]:
            continue
        best, best_score = -1, 0.5
        s_end = min(s_start + WINDOW, s_len)
        for si in range(s_start, s_end):
            if not sn[si]:
                continue
            max_len = max(len(wn[wi]), len(sn[si]))
            score = 1.0 - levenshtein(wn[wi], sn[si]) / max_len
            if score > best_score:
                best_score = score
                best = si
        if best >= 0:
            anchors.append({'wi': wi, 'si': best})
            s_start = best + 1

    anchors.append({'wi': w_len - 1, 'si': s_len - 1})
    real_anchors = len(anchors) - 2
    anchor_pct = real_anchors / s_len if s_len > 0 else 0.0

    # Build whisper→sefaria index map
    w2s = [0] * w_len
    for ai in range(len(anchors) - 1):
        w0, s0 = anchors[ai]['wi'], anchors[ai]['si']
        w1, s1 = anchors[ai + 1]['wi'], anchors[ai + 1]['si']
        for wi in range(w0, w1 + 1):
            t = (wi - w0) / (w1 - w0) if w1 > w0 else 0.0
            w2s[wi] = min(round(s0 + t * (s1 - s0)), s_len - 1)

    # Build sparse timestamp array (first whisper word wins per sefaria slot)
    sparse: list[dict | None] = [None] * s_len
    for wi in range(w_len):
        si = w2s[wi]
        if sparse[si] is None:
            sparse[si] = {'start': whisper_words[wi]['start'], 'end': whisper_words[wi]['end']}

    known = [i for i, v in enumerate(sparse) if v is not None]
    out = list(sparse)

    # Interpolate between known anchors
    for ki in range(len(known) - 1):
        li, ri = known[ki], known[ki + 1]
        if ri - li <= 1:
            continue
        gap = ri - li
        l_end = out[li]['end']
        r_start = out[ri]['start']
        # If gap is negative or very small, distribute over the full span instead
        span = r_start - l_end
        if span < 0.05 * gap:
            l_end = out[li]['start']
            span = r_start - l_end
        for i in range(li + 1, ri):
            t = (i - li) / gap
            start = l_end + t * span
            dur = max(0.05, span / gap * 0.7)
            out[i] = {'start': round(start, 3), 'end': round(start + dur, 3)}

    # Leading nulls (before first known)
    if known and known[0] > 0:
        first = out[known[0]]
        for i in range(known[0] - 1, -1, -1):
            d = known[0] - i
            out[i] = {
                'start': round(first['start'] - d * 0.15, 3),
                'end': round(first['start'] - (d - 1) * 0.15, 3),
            }

    # Trailing nulls (after last known)
    if known and known[-1] < s_len - 1:
        last = out[known[-1]]
        for i in range(known[-1] + 1, s_len):
            d = i - known[-1]
            out[i] = {
                'start': round(last['end'] + (d - 1) * 0.15, 3),
                'end': round(last['end'] + d * 0.15, 3),
            }

    # Final fallback for any remaining nulls
    total_dur = whisper_words[-1]['end'] if whisper_words else 1.0
    for i in range(s_len):
        if out[i] is None:
            t = (i / max(1, s_len - 1)) * total_dur
            out[i] = {'start': round(t, 3), 'end': round(t + 0.3, 3)}

    return out, anchor_pct
