// src/localInteract.ts
import { createPublicClient, createWalletClient, http, parseAbi, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

const ADMIN_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const INVESTOR_1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

const adminAccount = privateKeyToAccount(ADMIN_PRIVATE_KEY);
const investor1Account = privateKeyToAccount(INVESTOR_1_PRIVATE_KEY);

const KYC_REGISTRY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const INVESTOR_1 = investor1Account.address;
const INVESTOR_2 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Anvil account #2

const transport = http("http://127.0.0.1:8545");

const publicClient = createPublicClient({ chain: localhost, transport });
const adminWallet = createWalletClient({ account: adminAccount, chain: localhost, transport });
const investor1Wallet = createWalletClient({ account: investor1Account, chain: localhost, transport });

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

async function main() {
  console.log("=== 1. Compliance Onboarding ===");
  console.log("Verifying Investor 1 and Investor 2 on KYCRegistry...");
  
  let tx = await adminWallet.writeContract({
    address: KYC_REGISTRY_ADDRESS,
    abi: kycAbi,
    functionName: "verifyInvestor",
    args: [INVESTOR_1],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });

  tx = await adminWallet.writeContract({
    address: KYC_REGISTRY_ADDRESS,
    abi: kycAbi,
    functionName: "verifyInvestor",
    args: [INVESTOR_2],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log("Both investors verified on-chain.\n");

  console.log("=== 2. Minting Settlement Tokens ===");
  tx = await adminWallet.writeContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "mint",
    args: [INVESTOR_1, parseUnits("50000", 18)],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log(`Minted 50,000 MNCASH to Investor 1 (Tx: ${tx})\n`);

  console.log("=== 3. Executing Compliant Settlement ===");
  console.log(`Transferring 12,500 MNCASH: ${INVESTOR_1} -> ${INVESTOR_2}...`);
  tx = await investor1Wallet.writeContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "transfer",
    args: [INVESTOR_2, parseUnits("12500", 18)],
  });
  await publicClient.waitForTransactionReceipt({ hash: tx });
  console.log(`Settlement finalized on-chain (Tx: ${tx})\n`);

  const bal1 = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [INVESTOR_1],
  });
  const bal2 = await publicClient.readContract({
    address: TOKEN_ADDRESS,
    abi: tokenAbi,
    functionName: "balanceOf",
    args: [INVESTOR_2],
  });

  console.log(`Investor 1 Balance: ${formatUnits(bal1, 18)} MNCASH`);
  console.log(`Investor 2 Balance: ${formatUnits(bal2, 18)} MNCASH`);
}

main().catch(console.error);