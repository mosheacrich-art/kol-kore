-- Study streaks: +1 per day when a student plays their teacher's audio.
-- Run in Supabase → SQL Editor.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_last_date date;

CREATE OR REPLACE FUNCTION bump_streak(p_student_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Europe/Madrid')::date;
  v_last  date;
  v_streak integer;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_student_id THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  SELECT streak_last_date, COALESCE(streak, 0) INTO v_last, v_streak
  FROM profiles WHERE id = p_student_id FOR UPDATE;

  IF v_last = v_today THEN
    RETURN v_streak;                       -- already counted today
  ELSIF v_last = v_today - 1 THEN
    v_streak := v_streak + 1;              -- consecutive day
  ELSE
    v_streak := 1;                         -- first day or streak broken
  END IF;

  UPDATE profiles SET streak = v_streak, streak_last_date = v_today WHERE id = p_student_id;
  RETURN v_streak;
END;
$$;

GRANT EXECUTE ON FUNCTION bump_streak(uuid) TO authenticated;

-- Milan Karaos: start at 22, continuing (next study day → 23, 24, ...)
UPDATE profiles
SET streak = 22,
    streak_last_date = (now() AT TIME ZONE 'Europe/Madrid')::date - 1
WHERE name ILIKE '%milan%kara%'
RETURNING id, name, streak, streak_last_date;
