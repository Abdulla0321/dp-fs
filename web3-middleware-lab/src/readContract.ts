// src/readContract.ts
import { createPublicClient, http, fallback, parseAbi, formatUnits } from "viem";
import { mainnet } from "viem/chains";

// 1. Configure the fallback RPC pool
const client = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://rpc.ankr.com/eth"),
    http("https://ethereum-rpc.publicnode.com"),
    http("https://1rpc.io/eth"),
    http("https://eth.merkle.io"),
  ]),
});

// 2. Define the minimal Human-Readable ABI for an ERC-20 token
const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
]);

// Official USDT contract address on Ethereum Mainnet
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

async function queryTokenContract() {
  console.log("Querying USDT Smart Contract on Ethereum Mainnet...\n");

  // Read token symbol
  const symbol = await client.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "symbol",
  });

  // Read decimals (USDT uses 6 decimals, not 18)
  const decimals = await client.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
  });

  // Read total supply
  const rawSupply = await client.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "totalSupply",
  });

  // Read balance of Binance 8 cold storage
  const binanceColdStorage = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8";
  const rawBalance = await client.readContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [binanceColdStorage],
  });

  console.log(`Token Symbol: ${symbol}`);
  console.log(`Decimals: ${decimals}`);
  console.log(`Total Supply: ${formatUnits(rawSupply, decimals)} ${symbol}`);
  console.log(`Binance Holdings: ${formatUnits(rawBalance, decimals)} ${symbol}`);
}

queryTokenContract().catch((err) => {
  console.error("Contract call failed:", err);
});