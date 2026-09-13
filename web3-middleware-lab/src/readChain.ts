import { createPublicClient, http, fallback, formatEther } from "viem";
import { mainnet } from "viem/chains";

// Redundant institutional-grade RPC pool
const client = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://rpc.ankr.com/eth"),
    http("https://ethereum-rpc.publicnode.com"),
    http("https://1rpc.io/eth"),
    http("https://eth.merkle.io"),
  ]),
});

async function queryChainState() {
  console.log("Connecting to Ethereum Mainnet RPC pool...");

  const blockNumber = await client.getBlockNumber();
  console.log(`Latest Finalized Block: ${blockNumber}`);

  // Binance 8 cold custody storage address
  const targetAddress = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8";
  const rawBalance = await client.getBalance({ address: targetAddress });

  console.log(`Target Address: ${targetAddress}`);
  console.log(`Raw Balance (Wei): ${rawBalance.toString()}`);
  console.log(`Formatted Balance: ${formatEther(rawBalance)} ETH`);
}

queryChainState().catch((error) => {
  console.error("All RPC endpoints failed:", error);
});