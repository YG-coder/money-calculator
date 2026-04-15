"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { calcLoanInterest, formatKRW, formatUnit } from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";
import SavingBanner from "@/components/calculator/SavingBanner";

const FIELDS = [
  {
    key: "principal",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "원금을 입력해주세요" : undefined,
  },
  {
    key: "rate",
    kind: "decimal" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0
        ? "이자율을 입력해주세요"
        : Number(v) > 50
          ? "이자율이 너무 높습니다"
          : undefined,
  },
  {
    key: "months",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "기간을 입력해주세요" : undefined,
  },
];

export default function LoanInterestCalc() {
  const { state, setValue, getWon, getNum } = useCalcState(FIELDS);

  const result = useMemo(() => {
    const p = getWon("principal");
    const r = getNum("rate");
    const m = getNum("months");

    if (!p || !r || !m) return null;

    return calcLoanInterest(p, r, m);
  }, [state, getWon, getNum]);

  return (
    <div className="space-y-5">
      <InputField
        label="대출 원금"
        name="principal"
        suffix="만원"
        placeholder="예: 30,000"
        hint="단위: 만원 (3억 → 30,000)"
        value={state.principal?.value ?? ""}
        error={state.principal?.error}
        onChange={(v) => setValue("principal", v)}
      />

      <InputField
        label="연 이자율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 4.5"
        value={state.rate?.value ?? ""}
        error={state.rate?.error}
        onChange={(v) => setValue("rate", v)}
      />

      <InputField
        label="대출 기간"
        name="months"
        suffix="개월"
        placeholder="예: 24"
        value={state.months?.value ?? ""}
        error={state.months?.error}
        onChange={(v) => setValue("months", v)}
      />

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard
              label="월 이자"
              value={formatKRW(result.monthlyInterest)}
              highlight
            />
            <ResultCard
              label="총 이자"
              value={formatUnit(result.totalInterest)}
            />
            <ResultCard
              label="만기 총 상환"
              value={formatUnit(result.totalPayment)}
            />
          </div>

          <SavingBanner
            message={result.savingMessage}
            isProfit={result.rateSaving > 0}
          />
        </div>
      )}
    </div>
  );
}
