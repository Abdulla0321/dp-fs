// src/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseUnits,
  formatUnits,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

// Known Anvil Accounts
const ADMIN_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const KYC_REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const rpcTransport = http(RPC_URL);
const publicClient = createPublicClient({ chain: localhost, transport: rpcTransport });
const adminWallet = createWalletClient({
  account: privateKeyToAccount(ADMIN_PK),
  chain: localhost,
  transport: rpcTransport,
});

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const kycAbi = parseAbi([
  "function verifyInvestor(address investor) external",
  "function isVerified(address investor) external view returns (bool)",
]);

const tokenAbi = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
]);

// --------------------------------------------------------------------------
// Swagger UI Docs
// --------------------------------------------------------------------------
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Institutional Web3 Settlement API",
    version: "1.0.0",
    description: "Regulatory-compliant token settlement engine with on-chain KYC verification & PostgreSQL indexing.",
  },
  paths: {
    "/api/v1/health": {
      get: { summary: "System & chain health check", responses: { 200: { description: "OK" } } },
    },
    "/api/v1/investor/{address}": {
      get: {
        summary: "Fetch investor KYC status and token balance",
        parameters: [{ name: "address", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/v1/compliance/verify": {
      post: {
        summary: "Onboard and verify an investor on-chain",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { investorAddress: { type: "string" } } } } },
        },
        responses: { 200: { description: "Verified" } },
      },
    },
    "/api/v1/settlement/mint": {
      post: {
        summary: "Issuer mints tokens to a verified investor",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { to: { type: "string" }, amount: { type: "number" } } } } },
        },
        responses: { 200: { description: "Minted" }, 422: { description: "Compliance Rejection" } },
      },
    },
    "/api/v1/settlement/transfer": {
      post: {
        summary: "Execute peer-to-peer compliant settlement",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", properties: { senderPrivateKey: { type: "string" }, to: { type: "string" }, amount: { type: "number" } } } } },
        },
        responses: { 200: { description: "Settled" }, 422: { description: "Compliance Rejection" } },
      },
    },
    "/api/v1/settlement/ledger": {
      get: {
        summary: "Query indexed off-chain relational ledger",
        parameters: [{ name: "address", in: "query", schema: { type: "string" } }, { name: "limit", in: "query", schema: { type: "integer" } }],
        responses: { 200: { description: "OK" } },
      },
    },
  },
};

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --------------------------------------------------------------------------
// Endpoints
// --------------------------------------------------------------------------
app.get("/api/v1/health", async (_req: Request, res: Response) => {
  try {
    const blockNumber = await publicClient.getBlockNumber();
    const dbPing = await db.query("SELECT NOW()");
    res.json({ status: "healthy", blockNumber: blockNumber.toString(), databaseTime: dbPing.rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: "degraded", error: err.message });
  }
});

app.get("/api/v1/investor/:address", async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!isAddress(address)) return res.status(400).json({ error: "Invalid Ethereum address" });

  try {
    const [isVerified, balance, symbol] = await Promise.all([
      publicClient.readContract({ address: KYC_REGISTRY_ADDRESS, abi: kycAbi, functionName: "isVerified", args: [address] }),
      publicClient.readContract({ address: TOKEN_ADDRESS, abi: tokenAbi, functionName: "balanceOf", args: [address] }),
      publicClient.readContract({ address: TOKEN_ADDRESS, abi: tokenAbi, functionName: "symbol" }),
    ]);

    res.json({ address, isKYCVerified: isVerified, balanceFormatted: formatUnits(balance, 18), symbol });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/compliance/verify", async (req: Request, res: Response) => {
  const { investorAddress } = req.body;
  if (!investorAddress || !isAddress(investorAddress)) {
    return res.status(400).json({ error: "Valid investorAddress is required" });
  }

  try {
    const txHash = await adminWallet.writeContract({
      address: KYC_REGISTRY_ADDRESS,
      abi: kycAbi,
      functionName: "verifyInvestor",
      args: [investorAddress],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    res.json({
      status: "success",
      message: "Investor verified on KYCRegistry",
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/settlement/mint", async (req: Request, res: Response) => {
  const { to, amount } = req.body;
  if (!to || !isAddress(to) || !amount) {
    return res.status(400).json({ error: "Valid 'to' address and 'amount' required" });
  }

  try {
    const txHash = await adminWallet.writeContract({
      address: TOKEN_ADDRESS,
      abi: tokenAbi,
      functionName: "mint",
      args: [to, parseUnits(amount.toString(), 18)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    res.json({
      status: "success",
      message: `Minted ${amount} tokens to ${to}`,
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err: any) {
    if (err.message?.includes("0x72a65d27") || err.signature === "0x72a65d27") {
      return res.status(422).json({
        status: "rejected",
        errorCode: "0x72a65d27",
        reason: "ReceiverNotKYCVerified: Recipient is not authorized on KYCRegistry.",
      });
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/v1/settlement/transfer", async (req: Request, res: Response) => {
  const { senderPrivateKey, to, amount } = req.body;

  if (!senderPrivateKey || !to || !isAddress(to) || !amount) {
    return res.status(400).json({ error: "senderPrivateKey, to address, and amount are required" });
  }

  try {
    const senderAccount = privateKeyToAccount(senderPrivateKey);
    const senderWallet = createWalletClient({
      account: senderAccount,
      chain: localhost,
      transport: rpcTransport,
    });

    const txHash = await senderWallet.writeContract({
      address: TOKEN_ADDRESS,
      abi: tokenAbi,
      functionName: "transfer",
      args: [to, parseUnits(amount.toString(), 18)],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    res.json({
      status: "success",
      message: `Settlement of ${amount} tokens transferred successfully`,
      from: senderAccount.address,
      to,
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
    });
  } catch (err: any) {
    const msg = err.message || "";
    if (msg.includes("0xbeaa25c3") || err.signature === "0xbeaa25c3") {
      return res.status(422).json({
        status: "rejected",
        errorCode: "0xbeaa25c3",
        reason: "SenderNotKYCVerified: Sender is not KYC cleared.",
      });
    }
    if (msg.includes("0x72a65d27") || err.signature === "0x72a65d27") {
      return res.status(422).json({
        status: "rejected",
        errorCode: "0x72a65d27",
        reason: "ReceiverNotKYCVerified: Recipient is not KYC cleared.",
      });
    }
    res.status(500).json({ error: msg });
  }
});

app.get("/api/v1/settlement/ledger", async (req: Request, res: Response) => {
  const { address, limit = "20" } = req.query;

  try {
    let query = "SELECT * FROM asset_transfers";
    const params: any[] = [];

    if (address && isAddress(address as string)) {
      query += " WHERE from_address ILIKE $1 OR to_address ILIKE $1";
      params.push(address);
    }

    query += ` ORDER BY id DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10) || 20);

    const result = await db.query(query, params);
    res.json({ count: result.rowCount, records: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Compliance Settlement API running at http://localhost:${PORT}`);
  console.log(`Interactive API Docs available at http://localhost:${PORT}/docs`);
});