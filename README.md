CWSE - Compliant Web3 Settlement Engine
CWSE is a full-stack, institutional-grade digital asset settlement platform that enforces execution-layer compliance on-chain, automatically streams and indexes transaction events, and exposes an interactive REST API for treasury, issuer, and compliance operations.

The project combines:

Solidity smart contracts with custom compliance revert selectors

Foundry automated testing and CI/CD validation

TypeScript middleware using Viem

Streaming event indexer with pooled PostgreSQL (Supabase) persistence

Express REST API with interactive Swagger (OpenAPI 3.0) documentation

Docker Compose multi-service container orchestration

Current Status
The system is fully operational with:

On-chain KYC identity verification and whitelist enforcement

Compliant minting and peer-to-peer ERC-20 transfers

Custom revert selector interception (0x72a65d27, 0xbeaa25c3)

Automated real-time blockchain event streaming to an off-chain ledger

Transaction backfill from block zero with automatic deduplication

Real-time investor balance and compliance status queries

Live Swagger interactive documentation at /docs

Automated GitHub Actions CI pipeline running recursive Foundry unit tests

Docker Compose multi-container environment (Anvil, Indexer, REST API)

The local EVM execution node runs on port 8545, and the Express settlement API runs on port 3000.

Tech Stack
Smart Contract & Protocol Layer
Solidity (v0.8.20+)

Foundry (Forge, Cast, Anvil)

OpenZeppelin Contracts (ERC-20 baseline, Access Control)

Middleware & Indexing
TypeScript

Node.js (v20+)

Viem (Typed Ethereum client and interface)

pg / pg.Pool (PostgreSQL client with resilient connection pooling)

dotenvx (Secure secret injection)

Ledger Database
PostgreSQL (Supabase)

API & Developer Tooling
Express.js

Swagger UI Express / OpenAPI 3.0

Docker / Docker Compose

GitHub Actions CI

Main Features
1. Execution-Layer Compliance Hooks
CWSE implements compliance checks directly inside the smart contract before any token state change occurs:

Pre-transfer validation: Intercepts transfers inside _update() / transfer hooks to confirm both sender and recipient are whitelisted.

Custom Revert Selectors: Emits gas-efficient custom errors (ReceiverNotKYCVerified(), SenderNotKYCVerified()) instead of generic revert strings.

Granular Role Control: Only authorized compliance officers can modify whitelist statuses, and only designated issuers can mint settlement assets.

2. Fault-Tolerant Blockchain Indexer
The indexing daemon maintains an off-chain relational mirror of all settlement activity:

Zero-Block Backfill: Automatically crawls historical blocks to capture missing transfers before starting live event listening.

Stateless Polling Engine: Avoids dropped WebSocket connection issues on long-lived instances by running persistent, polled filter syncs.

Idempotent Storage: Leverages database primary constraints to prevent duplicate ledger entries during re-indexing or network reorgs.

3. Institutional REST API
A unified API gateway decoupling on-chain RPC write operations from off-chain indexed reads:

System Health: Monitored sync states, block heights, and database connection checks.

Investor Onboarding: Dedicated endpoint to verify and whitelist investor addresses on-chain.

Settlement Execution: Direct mint and peer-to-peer compliant transfer endpoints.

Audit Ledger: Fast, paginated queries over historical settlement transactions without stressing RPC nodes.

4. Interactive OpenAPI / Swagger UI
Built-in interactive sandbox available at /docs.

Allows operations teams and third-party auditors to test onboarding, minting, transfer executions, and ledger queries directly within the browser.
dp-fs/
├── .github/
│   └── workflows/
│       └── test.yml                 # CI pipeline running recursive Foundry tests
├── lib/
│   ├── forge-std/                   # Foundry standard library
│   └── openzeppelin-contracts/      # Standard contract submodules
├── src/
│   ├── KYCRegistry.sol             # Whitelist identity registry contract
│   └── CompliantToken.sol          # Compliance-restricted ERC-20 token contract
├── test/
│   └── CompliantTokenTest.t.sol     # Compliance unit and revert test suite
├── web3-middleware-lab/
│   ├── src/
│   │   ├── indexer.ts              # Viem-to-Supabase event indexer daemon
│   │   ├── server.ts               # Express REST API and Swagger definitions
│   │   └── initDb.sql              # PostgreSQL audit ledger table schema
│   ├── Dockerfile                  # Container image for API and indexer
│   ├── package.json
│   └── .env.example
├── assets/
│   └── dp-fsdocs.jpg               # Swagger documentation preview asset
├── docker-compose.yml              # Multi-container orchestration (Anvil + API + Indexer)
├── foundry.toml                    # Foundry configuration and remappings
└── README.md
