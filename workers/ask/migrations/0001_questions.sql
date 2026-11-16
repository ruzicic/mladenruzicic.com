-- The question log (README.md "Question log", SECURITY.md "What is stored").
--
-- One row per typed question that passed the visitor check (a valid session
-- or a solved Turnstile) and the per-minute limit. What a row holds: when
-- (UTC), the question as the Worker read it (control characters removed,
-- at most 500 characters), how it ended, the links offered, how long it
-- took, token counts when the model's stream reported them, the model id
-- and the visitor's country as Cloudflare reports it.
--
-- What a row never holds: an address, a hash of one, a session id, a user
-- agent, or the answer's text. Nothing links two rows to one visitor.
--
-- Rows older than ASK_LOG_RETENTION_DAYS (90) are deleted by the Worker's
-- daily Cron Trigger.

CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  -- ISO 8601, UTC, milliseconds: "2026-11-16T09:30:00.000Z". Sorts as time.
  asked_at TEXT NOT NULL CHECK (length(asked_at) = 24),
  question TEXT NOT NULL CHECK (length(question) BETWEEN 1 AND 500),
  -- answer | unknown | out_of_scope | rate_limited | daily_limit |
  -- budget_reached | error | timeout (src/questions-log.ts LogOutcome)
  outcome TEXT NOT NULL,
  -- 1 when a repeat was answered from the ten-minute memo, not the model.
  replayed INTEGER NOT NULL DEFAULT 0 CHECK (replayed IN (0, 1)),
  -- JSON array of the links offered under the answer, e.g. ["/work/tenderlift"].
  sources TEXT NOT NULL DEFAULT '[]',
  duration_ms INTEGER NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  model TEXT,
  -- Two letters (request.cf.country), or NULL.
  country TEXT CHECK (country IS NULL OR length(country) = 2)
);

CREATE INDEX questions_asked_at ON questions (asked_at);
