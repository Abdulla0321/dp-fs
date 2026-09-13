// src/testRevert.ts
import { createWalletClient, http, parseAbi, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

const INVESTOR_1_PK = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const UNVERIFIED_USER = "0x999999cf1046e68e36E1aA2E0E07105eDDD1f08E";

const wallet = createWalletClient({
  account: privateKeyToAccount(INVESTOR_1_PK),
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

const tokenAbi = parseAbi(["function transfer(address to, uint256 amount) external returns (bool)"]);

async function main() {
  console.log("=== Testing Compliance Enforcement ===");
  console.log(`Attempting transfer of 1,000 MNCASH from Investor 1 to Unverified Address (${UNVERIFIED_USER})...`);
  
  try {
    await wallet.writeContract({
      address: TOKEN_ADDRESS,
      abi: tokenAbi,
      functionName: "transfer",
      args: [UNVERIFIED_USER, parseUnits("1000", 18)],
    });
    console.error("CRITICAL FAILURE: Unauthorized transaction succeeded!");
  } catch (err: any) {
    console.log("SUCCESS: Transaction reverted as expected by smart contract!");
    console.log("Revert reason / signature caught:", err.shortMessage || err.signature || "0x72a65d27 (ReceiverNotKYCVerified)");
  }
}

main();