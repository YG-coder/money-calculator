"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW } from "@/lib/loan";
import {
  compareDepositVsSavings,
  type TaxType,
} from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "monthly", kind: "money" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
];

// 사이트 관례: 과세 유형은 일반과세·비과세만 노출 (세금우대는 조건 확인 전까지 미노출)
const TAX_OPTIONS: { value: TaxType; label: string }[] = [
  { value: "general", label: "일반과세" },
  { value: "taxExempt", label: "비과세" },
];

export default function SavingsCompareCalc() {
  const { state, setValue } = useCalcState(FIELDS);
  const [taxType, setTaxType] = useState<TaxType>("general");

  // 현재 렌더의 state.raw를 직접 읽는다 (getWon/getNum의 ref는 한 박자 늦어 stale)
  const won = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n * 10_000;
  };
  const num = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n;
  };
  const filled = (key: string) => (state[key]?.raw ?? "") !== "";

  const result = useMemo(() => {
    const monthly = won("monthly");
    const months = num("months");
    if (!monthly || !months || !filled("rate")) return null;

    return compareDepositVsSavings({
      monthlyDeposit: monthly,
      months,
      annualRate: num("rate"),
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
        placeholder="예: 100"
        hint="적금에 매달 넣는 금액. 예금은 이 금액 × 기간을 처음부터 예치했다고 가정합니다."
        value={state.monthly?.value ?? ""}
        onChange={(v) => setValue("monthly", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="기간"
          name="months"
          suffix="개월"
          placeholder="예: 12"
          value={state.months?.value ?? ""}
          onChange={(v) => setValue("months", v)}
        />
        <InputField
          label="연 이자율"
          name="rate"
          suffix="%"
          step={0.1}
          placeholder="예: 5.0"
          value={state.rate?.value ?? ""}
          onChange={(v) => setValue("rate", v)}
        />
      </div>

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
            ? "일반과세 15.4% (이자소득세 14% + 지방소득세 1.4%) 적용."
            : "비과세 — 이자소득세를 적용하지 않습니다."}
        </p>
      </div>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 세후 이자 — 예금 vs 적금 + 배수 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="예금 세후 이자"
              value={formatKRW(result.deposit.netInterest)}
              sub={`총 원금 대비 ${result.depositNetInterestRate.toFixed(2)}%`}
              highlight
            />
            <ResultCard
              label="적금 세후 이자"
              value={formatKRW(result.savings.netInterest)}
              sub={`총 납입액 대비 ${result.savingsNetInterestRate.toFixed(2)}%`}
            />
          </div>

          {result.netInterestMultiple !== null && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-center text-sm text-slate-700">
              같은 금리·같은 총액인데, 예금 세후 이자가 적금의 약{" "}
              <strong className="text-brand-700">
                {result.netInterestMultiple.toFixed(2)}배
              </strong>
              입니다.
            </div>
          )}

          {/* 상세 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="예금 만기 수령액 (세후)"
              value={formatKRW(result.deposit.maturityAmount)}
              sub={`총액 ${formatKRW(result.totalPrincipal)} 일시예치`}
            />
            <ResultCard
              label="적금 만기 수령액 (세후)"
              value={formatKRW(result.savings.maturityAmount)}
              sub={`총 납입 ${formatKRW(result.totalPrincipal)}`}
            />
          </div>
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          예금은 처음부터 목돈이 있다는 가정이고, 적금은 매달 돈을 모으는
          상품이므로 표면금리만으로 어느 쪽이 유리한지 판단할 수 없습니다. 이
          계산기는 같은 금리라도 원금이 굴러가는 기간이 달라 이자가 달라진다는
          점을 보여줍니다.
        </p>
        <p>
          ※ 적금 이자는 표준 정액적립식 근사치이며, 예금은 단리(만기일시) 기준
          예상치입니다. 실제 지급액은 상품·납입일·원 단위 처리에 따라 차이가 날 수
          있습니다.
        </p>
      </div>
    </div>
  );
}
