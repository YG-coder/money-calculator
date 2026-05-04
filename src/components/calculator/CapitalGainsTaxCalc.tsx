"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW } from "@/lib/loan";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  {
    key: "sellPrice",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "양도가액을 입력해주세요" : undefined,
  },
  {
    key: "buyPrice",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      !v || Number(v) <= 0 ? "취득가액을 입력해주세요" : undefined,
  },
  {
    key: "expense",
    kind: "money" as const,
    defaultValue: "",
  },
  {
    key: "deduction",
    kind: "money" as const,
    defaultValue: "250",  // 250만원 = 기본공제 연간 한도
  },
  {
    key: "taxRate",
    kind: "decimal" as const,
    defaultValue: "22",
    validate: (v: string) =>
      !v || Number(v) < 0 ? "세율을 입력해주세요" : undefined,
  },
];

export default function CapitalGainsTaxCalc() {
  const { state, setValue, getWon, getNum } = useCalcState(FIELDS);

  const result = useMemo(() => {
    // getWon: 만원 단위 입력 → 원 단위로 변환됨
    const sell = getWon("sellPrice");
    const buy = getWon("buyPrice");
    const cost = getWon("expense");
    const basicDeduction = getWon("deduction");
    const rate = getNum("taxRate");

    if (!sell || !buy || rate < 0) return null;

    const gain = sell - buy - cost;
    const taxableIncome = Math.max(gain - basicDeduction, 0);
    const capitalGainsTax = taxableIncome * (rate / 100);
    const localTax = capitalGainsTax * 0.1;
    const totalTax = capitalGainsTax + localTax;

    return {
      gain,
      taxableIncome,
      capitalGainsTax,
      localTax,
      totalTax,
    };
  }, [state, getWon, getNum]);

  return (
    <div className="space-y-5">
      <InputField
        label="양도가액 (실거래가)"
        name="sellPrice"
        suffix="만원"
        placeholder="예: 80,000"
        hint="단위: 만원 (8억 → 80,000)"
        value={state.sellPrice?.value ?? ""}
        error={state.sellPrice?.error}
        onChange={(v) => setValue("sellPrice", v)}
      />

      <InputField
        label="취득가액"
        name="buyPrice"
        suffix="만원"
        placeholder="예: 50,000"
        hint="단위: 만원 (5억 → 50,000)"
        value={state.buyPrice?.value ?? ""}
        error={state.buyPrice?.error}
        onChange={(v) => setValue("buyPrice", v)}
      />

      <InputField
        label="필요경비"
        name="expense"
        suffix="만원"
        placeholder="예: 1,000"
        hint="중개수수료, 법무사비, 자본적 지출 등"
        value={state.expense?.value ?? ""}
        error={state.expense?.error}
        onChange={(v) => setValue("expense", v)}
      />

      <InputField
        label="기본공제"
        name="deduction"
        suffix="만원"
        placeholder="250"
        hint="연간 1회 250만원 자동 적용"
        value={state.deduction?.value ?? ""}
        error={state.deduction?.error}
        onChange={(v) => setValue("deduction", v)}
      />

      <InputField
        label="예상 세율"
        name="taxRate"
        suffix="%"
        step={0.1}
        placeholder="예: 22"
        hint="과세표준 구간에 따른 기본세율 (6% ~ 45%)"
        value={state.taxRate?.value ?? ""}
        error={state.taxRate?.error}
        onChange={(v) => setValue("taxRate", v)}
      />

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="예상 총 세금"
              value={formatKRW(result.totalTax)}
              sub="양도소득세 + 지방소득세 합계"
              highlight
            />
            <ResultCard
              label="양도차익"
              value={formatKRW(result.gain)}
              sub="양도가 − 취득가 − 필요경비"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ResultCard
              label="양도소득세"
              value={formatKRW(result.capitalGainsTax)}
              sub="과세표준 × 세율"
            />
            <ResultCard
              label="지방소득세"
              value={formatKRW(result.localTax)}
              sub="양도소득세의 10%"
            />
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-sm text-slate-600">
            <p className="font-bold text-slate-800 mb-3">📋 세금 구성 요약</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>양도차익</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatKRW(result.gain)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>− 기본공제</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatKRW(getWon("deduction"))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>= 과세표준</span>
                <span className="font-semibold tabular-nums text-slate-800">
                  {formatKRW(result.taxableIncome)}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between font-bold text-slate-900">
                <span>총 세금</span>
                <span className="text-brand-600 tabular-nums">
                  {formatKRW(result.totalTax)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            ※ 단순 시뮬레이션이며 실제 세액은 보유기간, 1세대 1주택 비과세,
            장기보유특별공제, 다주택 중과 여부 등에 따라 크게 달라질 수
            있습니다. 정확한 세금은 국세청 또는 세무 전문가에게 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}
