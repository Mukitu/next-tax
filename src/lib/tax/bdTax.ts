export type BdTaxBreakdownLine = {
  from: number;
  to: number | null;
  rate: number;
  amountInSlab: number;
  taxForSlab: number;
};

export type BdTaxResult = {
  fiscalYear: string;
  totalIncome: number;
  totalExpense: number;
  taxableIncome: number;
  calculatedTax: number;
  breakdown: BdTaxBreakdownLine[];
};

export type BdTaxSlab = { from: number; to: number | null; rate: number };

// Progressive slabs (BDT)
const SLABS: Array<{ from: number; to: number | null; rate: number }> = [
  { from: 0, to: 350000, rate: 0 },
  { from: 350000, to: 450000, rate: 0.05 },
  { from: 450000, to: 750000, rate: 0.1 },
  { from: 750000, to: 1100000, rate: 0.15 },
  { from: 1100000, to: 1600000, rate: 0.2 },
  { from: 1600000, to: null, rate: 0.25 },
];

function clampMoney(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100) / 100);
}

export function calculateBdTax(params: {
  totalIncome: number;
  totalExpense: number;
  fiscalYear?: string;
  slabs?: BdTaxSlab[];
}): BdTaxResult {
  // Stored for reporting/history; avoid displaying fiscal-year copy in UI as requested.
  const fiscalYear = params.fiscalYear ?? "2026-2027";
  const totalIncome = clampMoney(params.totalIncome);
  const totalExpense = clampMoney(params.totalExpense);
  const taxableIncome = clampMoney(totalIncome - totalExpense);

  const activeSlabs = (params.slabs && params.slabs.length ? params.slabs : SLABS).map((s) => ({
    from: Number(s.from),
    to: s.to === null ? null : Number(s.to),
    rate: Number(s.rate),
  }));

  const breakdown: BdTaxBreakdownLine[] = activeSlabs
    .map((s) => {
    const upper = s.to ?? Number.POSITIVE_INFINITY;
    const amountInSlab = Math.max(0, Math.min(taxableIncome, upper) - s.from);
    const taxForSlab = clampMoney(amountInSlab * s.rate);
    return {
      from: s.from,
      to: s.to,
      rate: s.rate,
      amountInSlab: clampMoney(amountInSlab),
      taxForSlab,
    };
  })
    .filter((l) => l.amountInSlab > 0 || l.rate === 0);

  const calculatedTax = clampMoney(breakdown.reduce((sum, l) => sum + l.taxForSlab, 0));

  return {
    fiscalYear,
    totalIncome,
    totalExpense,
    taxableIncome,
    calculatedTax,
    breakdown,
  };
}
