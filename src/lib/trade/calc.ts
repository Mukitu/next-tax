export type TradeType = "import" | "export";

export type TradeTaxResult = {
  rate: number;
  calculatedTax: number;
};

export function calculateTradeTax(params: {
  type: TradeType;
  amount: number;
  countryRate: number; // %
  categoryRate: number; // %
}): TradeTaxResult {
  const amount = Number.isFinite(params.amount) ? Math.max(0, params.amount) : 0;
  const rate = Math.max(0, (params.countryRate ?? 0) + (params.categoryRate ?? 0));
  const calculatedTax = Math.round(amount * (rate / 100) * 100) / 100;
  return { rate, calculatedTax };
}
