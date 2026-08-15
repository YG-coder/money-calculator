"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import { calcInstallmentSavings, type TaxType } from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  {
    key: "monthly",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "월 납입액을 입력해주세요" : undefined,
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
      !v || Number(v) <= 0 ? "납입 기간을 입력해주세요" : undefined,
  },
];

// UI에 노출하는 과세 유형은 일반과세 · 비과세 두 가지.
// (세금우대 taxPreferred는 적용 대상·상품 조건 확인 전까지 노출하지 않음 — 스펙 §4)
const TAX_OPTIONS: { value: TaxType; label: string }[] = [
  { value: "general", label: "일반과세" },
  { value: "taxExempt", label: "비과세" },
];

export default function InstallmentSavingsCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  // 반응성: getWon/getNum은 한 박자 늦는 latestStateRef를 읽으므로,
  // 현재 렌더의 state.raw를 직접 읽는다 (공식은 동일 — 로직 무변경).
  const won = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n * 10_000;
  };
  const num = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n;
  };
  const [taxType, setTaxType] = useState<TaxType>("general");

  const result = useMemo(() => {
    const monthlyDeposit = won("monthly");
    const rate = num("rate");
    const months = num("months");

    if (!monthlyDeposit || !rate || !months) return null;

    return calcInstallmentSavings({
      monthlyDeposit,
      annualRate: rate,
      months,
      taxType,
    });
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, taxType]);

  return (
    <div className="space-y-5">
      <InputField
        label="월 납입액"
        name="monthly"
        suffix="만원"
        placeholder="예: 50"
        hint="단위: 만원 (월 50만 원 → 50)"
        value={state.monthly?.value ?? ""}
        error={state.monthly?.error}
        onChange={(v) => setValue("monthly", v)}
      />

      <InputField
        label="연 이자율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 4.0"
        value={state.rate?.value ?? ""}
        error={state.rate?.error}
        onChange={(v) => setValue("rate", v)}
      />

      <InputField
        label="납입 기간"
        name="months"
        suffix="개월"
        placeholder="예: 12"
        value={state.months?.value ?? ""}
        error={state.months?.error}
        onChange={(v) => setValue("months", v)}
      />

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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ResultCard
              label="총 납입 원금"
              value={formatUnit(result.totalDeposited)}
            />
            <ResultCard label="세전 예상 이자" value={formatKRW(result.grossInterest)} />
            <ResultCard label="예상 이자과세" value={formatKRW(result.tax)} />
            <ResultCard label="세후 예상 이자" value={formatKRW(result.netInterest)} />
          </div>

          <ResultCard
            label="세후 예상 만기 수령액"
            value={formatUnit(result.maturityAmount)}
            sub={`총 납입 ${formatUnit(result.totalDeposited)} + 세후이자 ${formatKRW(
              result.netInterest,
            )}`}
            highlight
          />

          {/* 근사 모델 안내 — isApproximate 플래그로 렌더 */}
          {result.isApproximate && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">
                📌 표준 정액적립식 예상치
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                월 단위 표준 정액적립식 기준 예상치이며, 실제 금융기관의 일수 계산 및
                납입일 처리(선납·지연납입·중도해지 포함)에 따라 달라질 수 있습니다.
                세금 또한 일반 세율을 적용한 예상치로, 실제 원천징수·원 단위 처리에
                따라 차이가 날 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
