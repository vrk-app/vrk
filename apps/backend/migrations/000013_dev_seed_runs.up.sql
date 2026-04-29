BEGIN;

CREATE TABLE dev_seed_runs (
    seed_key TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    result_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (seed_key, version)
);

COMMIT;
