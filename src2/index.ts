// src/index.ts

interface TokenBalance {
  holder: string;
  symbol: string;
  decimals: number;
  rawBalance: bigint;
}

function formatUnits(balance: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const integerPart = balance / divisor;
  const remainder = balance % divisor;

  const remainderStr = remainder.toString().padStart(decimals, "0");
  return `${integerPart}.${remainderStr}`;
}

const mockInstitutionalHolding: TokenBalance = {
  holder: "0x71C...897",
  symbol: "MN-BOND",
  decimals: 18,
  rawBalance: 100000500000000000000000n, // 100,000.5 * 10^18
};

console.log("--- Institutional Asset Ledger ---");
console.log(`Asset: ${mockInstitutionalHolding.symbol}`);
console.log(`Holder: ${mockInstitutionalHolding.holder}`);
console.log(`Raw On-Chain Balance: ${mockInstitutionalHolding.rawBalance.toString()}`);
console.log(`Formatted Balance: ${formatUnits(mockInstitutionalHolding.rawBalance, mockInstitutionalHolding.decimals)}`);