Compliant Web3 Settlement Engine (CWSE) is a full-stack, institutional-grade digital asset settlement platform[cite: 1]. It enforces execution-layer compliance directly on-chain, automatically streams and indexes transaction events, and exposes an interactive REST API for treasury, issuer, and compliance operations[cite: 1].

---

### Key Capabilities

* **Solidity Smart Contracts:** Built with custom compliance revert selectors[cite: 1].
* **Automated Testing & CI/CD:** Powered by Foundry and GitHub Actions[cite: 1].
* **TypeScript Middleware:** Built with Viem for type-safe EVM interaction[cite: 1].
* **Streaming Event Indexer:** Off-chain ledger powered by pooled PostgreSQL (Supabase) persistence[cite: 1].
* **Institutional REST API:** Built with Express, including interactive Swagger (OpenAPI 3.0) documentation[cite: 1].
* **Containerized Architecture:** Orchestrated multi-service runtime via Docker Compose[cite: 1].

---

### Core System Features

**Execution-Layer Compliance Hooks**
* **Pre-Transfer Validation:** Intercepts transfers inside `_update()` / transfer hooks to confirm both sender and recipient are whitelisted[cite: 1].
* **Custom Revert Selectors:** Emits gas-efficient custom errors (`ReceiverNotKYCVerified()`, `SenderNotKYCVerified()`) instead of generic revert strings (`0x72a65d27`, `0xbeaa25c3`)[cite: 1].
* **Granular Role Control:** Restricted access ensures only authorized compliance officers can modify whitelist statuses and designated issuers can mint settlement assets[cite: 1].

**Fault-Tolerant Blockchain Indexer**
* **Zero-Block Backfill:** Automatically crawls historical blocks to capture missing transfers before starting live event listening[cite: 1].
* **Stateless Polling Engine:** Avoids dropped WebSocket connection issues on long-lived instances via persistent, polled filter syncs[cite: 1].
* **Idempotent Storage:** Leverages database primary constraints to prevent duplicate ledger entries during re-indexing or network reorgs[cite: 1].

**Institutional REST API**
* **System Health:** Monitored sync states, block heights, and database connection checks[cite: 1].
* **Investor Onboarding:** Dedicated endpoint to verify and whitelist investor addresses on-chain[cite: 1].
* **Settlement Execution:** Direct mint and peer-to-peer compliant transfer endpoints[cite: 1].
* **Audit Ledger:** Fast, paginated queries over historical settlement transactions without stressing RPC nodes[cite: 1].

**Interactive OpenAPI / Swagger UI**
* Includes a built-in interactive sandbox available at `/docs`[cite: 1].
* Enables operations teams and auditors to test onboarding, minting, transfer executions, and ledger queries directly within the browser[cite: 1].

---

### System Status & Operational Setup

| Component | Status / Detail |
| :--- | :--- |
| **Execution Node** | Anvil local EVM running on port 8545[cite: 1] |
| **Express API Gateway** | Live settlement API running on port 3000[cite: 1] |
| **Interactive Docs** | Live Swagger documentation accessible at `/docs`[cite: 1] |
| **CI/CD Pipeline** | Automated GitHub Actions running recursive Foundry unit tests[cite: 1] |
| **Verification & Compliance** | On-chain KYC identity verification and whitelist enforcement[cite: 1] |

---

### Technology Stack

* **Smart Contract & Protocol Layer:** Solidity (v0.8.20+), Foundry (Forge, Cast, Anvil), OpenZeppelin Contracts (ERC-20 baseline, Access Control)[cite: 1]
* **Middleware & Indexing:** TypeScript, Node.js (v20+), Viem, `pg` / `pg.Pool` (PostgreSQL client with resilient connection pooling), `dotenvx`[cite: 1]
* **Ledger Database:** PostgreSQL (Supabase)[cite: 1]
* **API & Tooling:** Express.js, Swagger UI Express / OpenAPI 3.0, Docker / Docker Compose, GitHub Actions CI[cite: 1]

---

### Repository Structure

```plaintext
dp-fs/
├── .github/
