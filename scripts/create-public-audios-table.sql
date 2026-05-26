-- Run this in Supabase → SQL Editor before running upload-ashkenazi.mjs

CREATE TABLE IF NOT EXISTS public_audios (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  parasha_id      text        NOT NULL,
  aliyah_idx      integer     NOT NULL,
  label           text        NOT NULL DEFAULT 'Ashkenazi',
  public_url      text        NOT NULL,
  file_type       text        DEFAULT 'audio/x-m4a',
  word_timestamps jsonb,
  needs_review    boolean     DEFAULT false,
  anchor_pct      float,
  created_at      timestamptz DEFAULT now(),

  UNIQUE (parasha_id, aliyah_idx, label)
);

-- Public read, no client writes (only service role via script)
ALTER TABLE public_audios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public_audios"
  ON public_audios FOR SELECT
  USING (true);
