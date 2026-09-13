// src/indexer.ts
import { createPublicClient, http, parseAbi, formatUnits } from "viem";
import { localhost } from "viem/chains";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const client = createPublicClient({
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

db.on("error", (err) => {
  console.warn("PostgreSQL connection drop auto-recovered:", err.message);
});

const tokenEventAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

async function startIndexer() {
  const ping = await db.query("SELECT NOW()");
  console.log("Connected to Supabase Ledger at:", ping.rows[0].now);

  console.log("Checking historical blocks for unindexed transfers...");
  const pastLogs = await client.getContractEvents({
    address: TOKEN_ADDRESS,
    abi: tokenEventAbi,
    eventName: "Transfer",
    fromBlock: 0n,
  });

  for (const log of pastLogs) {
    const { from, to, value } = log.args;
    if (from && to && value !== undefined) {
      const rawAmount = value.toString();
      const formattedAmount = formatUnits(value, 18);
      console.log(`[Backfill] Tx: ${log.transactionHash} | Amount: ${formattedAmount} MNCASH`);

      await db.query(
        `INSERT INTO asset_transfers (
          transaction_hash,
          block_number,
          from_address,
          to_address,
          amount_raw,
          amount_formatted
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (transaction_hash) DO NOTHING;`,
        [
          log.transactionHash,
          Number(log.blockNumber),
          from,
          to,
          rawAmount,
          formattedAmount,
        ]
      );
    }
  }
  console.log("Historical backfill completed.\n");

  console.log("Listening for new settlement events...\n");
  client.watchContractEvent({
    address: TOKEN_ADDRESS,
    abi: tokenEventAbi,
    eventName: "Transfer",
    poll: true,
    pollingInterval: 1_000,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { from, to, value } = log.args;
        if (from && to && value !== undefined) {
          const rawAmount = value.toString();
          const formattedAmount = formatUnits(value, 18);

          console.log(`[Live Event Detected] Tx: ${log.transactionHash}`);
          console.log(`  From: ${from} -> To: ${to}`);
          console.log(`  Amount: ${formattedAmount} MNCASH`);

          try {
            await db.query(
              `INSERT INTO asset_transfers (
                transaction_hash,
                block_number,
                from_address,
                to_address,
                amount_raw,
                amount_formatted
              ) VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (transaction_hash) DO NOTHING;`,
              [
                log.transactionHash,
                Number(log.blockNumber),
                from,
                to,
                rawAmount,
                formattedAmount,
              ]
            );
            console.log("  Successfully synced to Supabase.\n");
          } catch (err) {
            console.error("  Database insertion error:", err);
          }
        }
      }
    },
    onError: (err) => console.error("Event listener error:", err),
  });
}

startIndexer().catch((err) => {
  console.error("Indexer failure:", err);
});