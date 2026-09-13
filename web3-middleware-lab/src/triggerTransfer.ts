// src/triggerTransfer.ts
import { createPublicClient, createWalletClient, http, parseAbi, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

const ADMIN_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const INVESTOR_1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

const client = createWalletClient({
  account: privateKeyToAccount(ADMIN_PRIVATE_KEY),
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

const publicClient = createPublicClient({
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

const tokenAbi = parseAbi(["function mint(address to, uint256 amount) external"]);

async function main() {
  console.log("Minting an additional 10,000 MNCASH to Investor 1...");
  const hash = await client.writeContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "mint",
    args: [INVESTOR_1, parseUnits("10000", 18)],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`Transaction mined: ${hash}`);
}

main();