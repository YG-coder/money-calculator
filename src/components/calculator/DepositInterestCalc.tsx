"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import {
  calcDepositInterest,
  type InterestMethod,
  type TaxType,
} from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  {
    key: "principal",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "예치금을 입력해주세요" : undefined,
  },
  {
    key: "rate",
    kind: "decimal" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0
        ? "금리를 입력해주세요"
        : Number(v) > 20
          ? "금리가 너무 높습니다"
          : undefined,
  },
  {
    key: "months",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "예치 기간을 입력해주세요" : undefined,
  },
];

// UI에 노출하는 과세 유형은 일반과세 · 비과세 두 가지.
// (세금우대 taxPreferred는 적용 대상·상품 조건 확인 전까지 노출하지 않음 — 스펙 §4)
const TAX_OPTIONS: { value: TaxType; label: string }[] = [
  { value: "general", label: "일반과세" },
  { value: "taxExempt", label: "비과세" },
];

export default function DepositInterestCalc() {
  const { state, setValue, getWon, getNum } = useCalcState(FIELDS);
  const [method, setMethod] = useState<InterestMethod>("simple");
  const [taxType, setTaxType] = useState<TaxType>("general");

  const result = useMemo(() => {
    const principal = getWon("principal");
    const rate = getNum("rate");
    const months = getNum("months");

    if (!principal || !rate || !months) return null;

    return calcDepositInterest({
      principal,
      annualRate: rate,
      months,
      method,
      taxType,
    });
  }, [state, method, taxType, getWon, getNum]);

  return (
    <div className="space-y-5">
      <InputField
        label="예치금(원금)"
        name="principal"
        suffix="만원"
        placeholder="예: 1,000"
        hint="단위: 만원 (1,000만 원 → 1,000)"
        value={state.principal?.value ?? ""}
        error={state.principal?.error}
        onChange={(v) => setValue("principal", v)}
      />

      <InputField
        label="연 이자율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 3.5"
        value={state.rate?.value ?? ""}
        error={state.rate?.error}
        onChange={(v) => setValue("rate", v)}
      />

      <InputField
        label="예치 기간"
        name="months"
        suffix="개월"
        placeholder="예: 12"
        value={state.months?.value ?? ""}
        error={state.months?.error}
        onChange={(v) => setValue("months", v)}
      />

      {/* 이자 방식 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-600">이자 방식</p>
        <div className="grid grid-cols-2 gap-2">
          {(["simple", "monthlyCompound"] as InterestMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                method === m
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
              }`}
            >
              {m === "simple" ? "단리" : "월복리"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {method === "simple"
            ? "만기일시지급 단리 — 원금에만 이자가 붙습니다."
            : "월복리 — 매달 이자가 원금에 더해져 다음 이자에 포함됩니다."}
        </p>
      </div>

      {/* 과세 유형 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-600">과세 유형</p>
        <div className="grid grid-cols-2 gap-2">
          {TAX_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTaxType(opt.value)}
              className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                taxType === opt.value
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {taxType === "general"
            ? "일반과세: 이자소득세 15.4%(소득세 14% + 지방소득세 1.4%)를 적용한 예상치입니다."
            : "비과세는 비과세종합저축 등 법령이 정한 자격·상품 조건을 충족해야 적용됩니다. 누구나 임의로 선택되는 것은 아닙니다."}
        </p>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResultCard label="세전 이자" value={formatKRW(result.grossInterest)} />
            <ResultCard label="이자과세" value={formatKRW(result.tax)} />
            <ResultCard label="세후 이자" value={formatKRW(result.netInterest)} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="세후 만기 수령액"
              value={formatUnit(result.maturityAmount)}
              sub={`원금 ${formatUnit(result.principal)} + 세후이자`}
              highlight
            />
            <ResultCard
              label="세후 연환산 수익률"
              value={`${result.netAnnualizedRate.toFixed(2)}%`}
              sub="세후 이자 기준 연환산(CAGR형)"
            />
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            ※ 세금은 일반 세율을 적용한 예상치이며, 실제 금융기관의 원천징수 및 원
            단위 처리에 따라 차이가 날 수 있습니다. 표시 금리가 기본금리인지 우대금리
            포함인지, 중도해지 시 이율이 낮아지는지도 함께 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}
