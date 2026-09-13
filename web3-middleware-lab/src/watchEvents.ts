    // src/watchEvents.ts
import { createPublicClient, http, fallback, parseAbi, formatUnits } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http("https://rpc.ankr.com/eth"),
    http("https://ethereum-rpc.publicnode.com"),
    http("https://1rpc.io/eth"),
    http("https://eth.merkle.io"),
  ]),
});

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const USDT_DECIMALS = 6;

// ERC-20 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
const erc20EventAbi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

async function startEventListener() {
  console.log("Listening for live USDT Transfer events on Ethereum Mainnet...");
  console.log("Press Ctrl + C to stop listening.\n");

  // Subscribe to real-time events via polling the RPC pool
  const unwatch = client.watchContractEvent({
    address: USDT_ADDRESS,
    abi: erc20EventAbi,
    eventName: "Transfer",
    pollingInterval: 4_000, // Poll every 4 seconds
    onLogs: (logs) => {
      for (const log of logs) {
        const { from, to, value } = log.args;

        if (from && to && value !== undefined) {
          const formattedAmount = formatUnits(value, USDT_DECIMALS);

          console.log(`[Transfer Detected]`);
          console.log(`  Block: ${log.blockNumber}`);
          console.log(`  Tx Hash: ${log.transactionHash}`);
          console.log(`  From:   ${from}`);
          console.log(`  To:     ${to}`);
          console.log(`  Amount: ${formattedAmount} USDT`);
          console.log("--------------------------------------------------");
        }
      }
    },
    onError: (error) => {
      console.error("Event listener error:", error);
    },
  });
}

startEventListener().catch((err) => {
  console.error("Failed to start listener:", err);
});