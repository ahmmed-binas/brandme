"use client";

import { useId, useMemo, useState } from "react";
import { MAX_YEARS, aed, calculate, type Buyer, type Purpose, type Stage } from "@/lib/tools/uae-mortgage";

/**
 * The UAE mortgage calculator: price and buyer details on the left, the monthly
 * payment and every upfront cost on the right. All maths and rules live in
 * lib/tools/uae-mortgage.ts; this file is only the screen.
 */

const DEFAULTS = {
  price: 1_500_000,
  rate: 4.5,
  years: 25,
  agentPercent: 2,
  bankFeePercent: 1,
  valuation: 3_000,
};

export function MortgageCalculator() {
  const [price, setPrice] = useState(DEFAULTS.price);
  const [buyer, setBuyer] = useState<Buyer>("expat");
  const [purpose, setPurpose] = useState<Purpose>("first");
  const [stage, setStage] = useState<Stage>("ready");
  // null means "the legal minimum": it then follows the price and buyer type.
  const [downPayment, setDownPayment] = useState<number | null>(null);
  const [rate, setRate] = useState(DEFAULTS.rate);
  const [years, setYears] = useState(DEFAULTS.years);
  const [agentPercent, setAgentPercent] = useState(DEFAULTS.agentPercent);
  const [bankFeePercent, setBankFeePercent] = useState(DEFAULTS.bankFeePercent);
  const [valuation, setValuation] = useState(DEFAULTS.valuation);

  const result = useMemo(
    () =>
      calculate({
        price,
        buyer,
        purpose,
        stage,
        downPayment: downPayment ?? 0,
        yearlyRatePercent: rate,
        years,
        agentPercent,
        bankFeePercent,
        valuation,
      }),
    [price, buyer, purpose, stage, downPayment, rate, years, agentPercent, bankFeePercent, valuation],
  );
  const tooLow = downPayment !== null && downPayment < result.minDownPayment;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
      {/* Inputs */}
      <div className="rounded-3xl border border-rule bg-paper p-5 sm:p-7">
        <AmountField label="Property price" value={price} onChange={setPrice} />

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Choice
            label="You are"
            value={buyer}
            onChange={setBuyer}
            options={[
              ["expat", "Expat / resident"],
              ["national", "UAE national"],
            ]}
          />
          <Choice
            label="This home is"
            value={purpose}
            onChange={setPurpose}
            options={[
              ["first", "My first home"],
              ["second", "Second / investment"],
            ]}
          />
        </div>
        <div className="mt-5">
          <Choice
            label="Property is"
            value={stage}
            onChange={setStage}
            options={[
              ["ready", "Ready (completed)"],
              ["offplan", "Off-plan"],
            ]}
          />
        </div>

        <div className="mt-6">
          <AmountField
            label="Down payment"
            value={downPayment ?? result.minDownPayment}
            onChange={setDownPayment}
          />
          <p className={`mt-1.5 text-[0.84rem] ${tooLow ? "text-amber-800" : "text-ink-soft"}`}>
            {tooLow ? "Below the legal minimum, so we used the minimum: " : "Minimum by law: "}
            <span className="font-medium">{aed(result.minDownPayment)}</span> (
            {Math.round((1 - result.maxLtv) * 100)}%)
            {downPayment !== null && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => setDownPayment(null)}
                  className="underline underline-offset-4"
                >
                  Use the minimum
                </button>
              </>
            )}
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <NumberField
            label="Interest rate"
            suffix="% a year"
            value={rate}
            step={0.05}
            min={0}
            max={15}
            onChange={setRate}
          />
          <NumberField
            label="Loan term"
            suffix="years"
            value={years}
            step={1}
            min={1}
            max={MAX_YEARS}
            onChange={setYears}
          />
        </div>
        <p className="mt-1.5 text-[0.8rem] text-ink-soft">
          Rates change often: ask your bank for today’s rate. Maximum term {MAX_YEARS} years.
        </p>

        <details className="mt-6 rounded-2xl border border-rule px-4 py-3">
          <summary className="cursor-pointer text-[0.92rem] font-medium text-ink">
            Fees you can adjust
          </summary>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <NumberField
              label="Agent commission"
              suffix="%"
              value={agentPercent}
              step={0.25}
              min={0}
              max={5}
              onChange={setAgentPercent}
            />
            <NumberField
              label="Bank fee"
              suffix="% of loan"
              value={bankFeePercent}
              step={0.25}
              min={0}
              max={2}
              onChange={setBankFeePercent}
            />
            <NumberField
              label="Valuation"
              suffix="AED"
              value={valuation}
              step={250}
              min={0}
              max={10_000}
              onChange={setValuation}
            />
          </div>
        </details>
      </div>

      {/* Results */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-3xl bg-ink p-6 text-paper sm:p-8">
          <p className="text-[0.85rem] text-paper/70">Monthly payment</p>
          <p
            className="mt-1 font-display text-[clamp(2.4rem,6vw,3.6rem)] leading-none tabular-nums"
            aria-live="polite"
          >
            {aed(result.monthly)}
          </p>
          <dl className="mt-6 grid grid-cols-3 gap-3 text-[0.82rem]">
            <Stat label="Loan" value={aed(result.loan)} />
            <Stat label="Loan-to-value" value={`${Math.round(result.ltv * 100)}%`} />
            <Stat label="Total interest" value={aed(result.totalInterest)} />
          </dl>
        </div>

        <div className="mt-4 rounded-3xl border border-rule bg-paper p-6 sm:p-7">
          <h3 className="font-display text-xl text-ink">Cash you need up front</h3>
          <table className="mt-4 w-full text-[0.92rem]">
            <tbody>
              {result.upfront.map((line) => (
                <tr key={line.label} className="border-b border-rule last:border-0">
                  <td className="py-2.5 pr-3">
                    <span className="block text-ink">{line.label}</span>
                    {line.note && <span className="block text-[0.78rem] text-ink-soft">{line.note}</span>}
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-ink">{aed(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink">
                <td className="pt-3 font-medium text-ink">Total up front</td>
                <td className="pt-3 text-right font-display text-xl tabular-nums text-ink">
                  {aed(result.upfrontTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-[0.82rem] text-ink-soft">
            Of which fees: {aed(result.feesTotal)} (
            {Math.round((result.feesTotal / (price || 1)) * 1000) / 10}% of the price).
          </p>
        </div>

        <div className="mt-4 rounded-3xl bg-ink/5 p-6">
          <p className="text-[0.85rem] text-ink-soft">Income banks will want to see</p>
          <p className="mt-1 font-display text-2xl tabular-nums text-ink">
            {aed(result.incomeNeeded)} <span className="text-base text-ink-soft">a month</span>
          </p>
          <p className="mt-2 text-[0.82rem] leading-relaxed text-ink-soft">
            At least, before other loans and credit cards. All your repayments must stay under half your
            income, and the loan under {buyer === "national" ? 8 : 7} years of income.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small inputs
// ---------------------------------------------------------------------------

/** An AED amount shown with thousands separators; accepts typing like "1,500,000". */
function AmountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[0.9rem] font-medium text-ink">
        {label}
      </label>
      <div className="mt-2 flex items-center rounded-xl border border-rule bg-paper px-4 focus-within:border-ink">
        <span className="text-ink-soft">AED</span>
        <input
          id={id}
          inputMode="numeric"
          value={value.toLocaleString("en-GB")}
          onChange={(event) => onChange(Number(event.target.value.replace(/\D/g, "")) || 0)}
          className="w-full bg-transparent px-3 py-3 font-display text-xl tabular-nums text-ink outline-none"
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  suffix,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-[0.9rem] font-medium text-ink">
        {label}
      </label>
      <div className="mt-2 flex items-center rounded-xl border border-rule bg-paper px-3 focus-within:border-ink">
        <input
          id={id}
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || 0)))}
          className="w-full min-w-0 bg-transparent py-2.5 tabular-nums text-ink outline-none"
        />
        <span className="shrink-0 pl-2 text-[0.82rem] text-ink-soft">{suffix}</span>
      </div>
    </div>
  );
}

/** Two buttons that act as a radio choice. */
function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<[T, string]>;
}) {
  return (
    <fieldset>
      <legend className="text-[0.9rem] font-medium text-ink">{label}</legend>
      <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl border border-rule p-1">
        {options.map(([option, text]) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`rounded-lg px-2 py-2 text-[0.86rem] transition ${value === option ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-paper/60">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
