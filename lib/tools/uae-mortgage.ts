/**
 * UAE mortgage maths for /tools/uae-mortgage-calculator. Pure functions, no
 * database, so the page works entirely in the browser.
 *
 * RULES, last checked 12 October 2026. Update RULES_CHECKED when you re-check.
 *
 * Central Bank of the UAE, Regulations Regarding Mortgage Loans, Article 3
 * (Circular 31/2013 as amended, in force):
 * https://rulebook.centralbank.ae/en/rulebook/article-3-important-ratios
 *   - Maximum loan-to-value (LTV):
 *       UAE nationals, first home: 85% up to AED 5M, 75% above
 *       Expatriates, first home:   80% up to AED 5M, 70% above
 *       Second home or investment: 65% nationals, 60% expatriates
 *       Off-plan, everyone:        50%
 *   - Maximum term 25 years. Debt burden (all loan repayments) at most 50% of
 *     income. Loan at most 8 (nationals) or 7 (expatriates) years' income.
 *
 * Dubai purchase costs (Dubai Land Department fees as published by agencies
 * and banks; other emirates differ, and every amount is editable on the page):
 *   - DLD transfer fee 4% of the price, plus AED 580 admin (apartment title deed)
 *   - Mortgage registration 0.25% of the loan, plus AED 290
 *   - Registration trustee: AED 4,000 + VAT (price AED 500,000 or more),
 *     AED 2,000 + VAT below
 *   - Agent commission: usually 2% + VAT
 *   - Bank arrangement fee: usually up to 1% of the loan + VAT
 *   - Valuation: usually AED 2,500–3,500 + VAT
 */

export const RULES_CHECKED = "12 October 2026";
export const RULES_SOURCE = "https://rulebook.centralbank.ae/en/rulebook/article-3-important-ratios";

export const VAT = 0.05;
export const MAX_YEARS = 25;
const PRICE_THRESHOLD = 5_000_000;

export type Buyer = "expat" | "national";
export type Purpose = "first" | "second";
export type Stage = "ready" | "offplan";

/** The highest share of the price a bank may lend, under the Central Bank rules above. */
export function maxLoanToValue(price: number, buyer: Buyer, purpose: Purpose, stage: Stage): number {
  if (stage === "offplan") return 0.5;
  if (purpose === "second") return buyer === "national" ? 0.65 : 0.6;
  const above = price > PRICE_THRESHOLD;
  if (buyer === "national") return above ? 0.75 : 0.85;
  return above ? 0.7 : 0.8;
}

/** The monthly repayment of a standard (reducing balance) mortgage. */
export function monthlyPayment(loan: number, yearlyRatePercent: number, years: number): number {
  const months = Math.round(years * 12);
  if (loan <= 0 || months <= 0) return 0;
  const rate = yearlyRatePercent / 100 / 12;
  if (rate === 0) return loan / months;
  return (loan * rate) / (1 - (1 + rate) ** -months);
}

export interface MortgageInput {
  price: number;
  buyer: Buyer;
  purpose: Purpose;
  stage: Stage;
  /** Cash put down, in AED. Raised to the legal minimum if too low. */
  downPayment: number;
  yearlyRatePercent: number;
  years: number;
  /** Agent commission as a percentage of the price (0 if buying direct). */
  agentPercent: number;
  /** Bank arrangement fee as a percentage of the loan. */
  bankFeePercent: number;
  /** Valuation fee in AED, before VAT. */
  valuation: number;
}

export interface CostLine {
  label: string;
  amount: number;
  note?: string;
}

export interface MortgageResult {
  maxLtv: number;
  minDownPayment: number;
  downPayment: number;
  loan: number;
  ltv: number;
  years: number;
  monthly: number;
  totalInterest: number;
  /** Everything paid up front, down payment included. */
  upfront: CostLine[];
  upfrontTotal: number;
  /** Fees only (the upfront total without the down payment). */
  feesTotal: number;
  /** Rough minimum monthly income a bank will want to see. */
  incomeNeeded: number;
}

const round = (value: number) => Math.round(value);

export function calculate(input: MortgageInput): MortgageResult {
  const price = Math.max(0, input.price);
  const years = Math.min(MAX_YEARS, Math.max(1, input.years));
  const maxLtv = maxLoanToValue(price, input.buyer, input.purpose, input.stage);
  const minDownPayment = price * (1 - maxLtv);
  const downPayment = Math.min(price, Math.max(minDownPayment, input.downPayment));
  const loan = price - downPayment;
  const monthly = monthlyPayment(loan, input.yearlyRatePercent, years);
  const totalInterest = Math.max(0, monthly * years * 12 - loan);

  const withVat = (amount: number) => amount * (1 + VAT);
  const trustee = price >= 500_000 ? 4_000 : 2_000;
  const upfront: CostLine[] = [
    {
      label: "Down payment",
      amount: downPayment,
      note: `${Math.round((downPayment / (price || 1)) * 100)}% of the price`,
    },
    { label: "DLD transfer fee", amount: price * 0.04 + 580, note: "4% of the price + AED 580 admin" },
    {
      label: "Mortgage registration",
      amount: loan > 0 ? loan * 0.0025 + 290 : 0,
      note: "0.25% of the loan + AED 290",
    },
    {
      label: "Registration trustee",
      amount: withVat(trustee),
      note: `AED ${trustee.toLocaleString("en-GB")} + VAT`,
    },
    {
      label: "Agent commission",
      amount: withVat((price * input.agentPercent) / 100),
      note: `${input.agentPercent}% of the price + VAT`,
    },
    {
      label: "Bank arrangement fee",
      amount: loan > 0 ? withVat((loan * input.bankFeePercent) / 100) : 0,
      note: `${input.bankFeePercent}% of the loan + VAT`,
    },
    {
      label: "Valuation",
      amount: loan > 0 ? withVat(input.valuation) : 0,
      note: "Paid to the bank's valuer, + VAT",
    },
  ].map((line) => ({ ...line, amount: round(line.amount) }));
  const upfrontTotal = upfront.reduce((sum, line) => sum + line.amount, 0);

  // Banks cap all repayments at 50% of income, and the loan at 7 (expats) or 8 (nationals)
  // years of income. This is the higher of the two, ignoring other debts and stress tests.
  const incomeYears = input.buyer === "national" ? 8 : 7;
  const incomeNeeded = Math.max(monthly / 0.5, loan / (incomeYears * 12));

  return {
    maxLtv,
    minDownPayment: round(minDownPayment),
    downPayment: round(downPayment),
    loan: round(loan),
    ltv: price ? loan / price : 0,
    years,
    monthly: round(monthly),
    totalInterest: round(totalInterest),
    upfront,
    upfrontTotal,
    feesTotal: upfrontTotal - round(downPayment),
    incomeNeeded: round(incomeNeeded),
  };
}

/** "AED 1,234,567" */
export const aed = (value: number) => `AED ${Math.round(value).toLocaleString("en-GB")}`;
