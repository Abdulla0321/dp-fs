-- src/initDb.sql
CREATE TABLE IF NOT EXISTS asset_transfers (
    id SERIAL PRIMARY KEY,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount_raw NUMERIC(78, 0) NOT NULL,
    amount_formatted NUMERIC(38, 18) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_from ON asset_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON asset_transfers(to_address);