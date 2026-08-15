"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import {
  goalRequiredMonthly,
  goalRequiredMonths,
  goalFinalAmount,
  type GoalMode,
} from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  {
    key: "target",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      v && Number(v) <= 0 ? "목표 금액을 확인해주세요" : undefined,
  },
  {
    key: "monthly",
    kind: "money" as const,
    defaultValue: "",
    validate: (v: string) =>
      v && Number(v) <= 0 ? "월 납입액을 확인해주세요" : undefined,
  },
  {
    key: "months",
    kind: "integer" as const,
    defaultValue: "",
    validate: (v: string) =>
      v && Number(v) > 600 ? "기간은 600개월(50년) 이하로 입력해주세요" : undefined,
  },
  {
    key: "rate",
    kind: "decimal" as const,
    defaultValue: "",
    validate: (v: string) =>
      v && Number(v) > 20 ? "금리가 너무 높습니다" : undefined,
  },
];

const MODES: { value: GoalMode; label: string; hint: string }[] = [
  {
    value: "targetToMonthly",
    label: "월 납입액 구하기",
    hint: "목표 금액과 기간을 정하면 매달 얼마씩 넣어야 하는지 알려드립니다.",
  },
  {
    value: "monthlyToMonths",
    label: "필요 기간 구하기",
    hint: "매달 넣을 금액과 목표 금액을 정하면 얼마나 걸리는지 알려드립니다.",
  },
  {
    value: "monthlyAndMonthsToAmount",
    label: "도달 금액 구하기",
    hint: "매달 넣을 금액과 기간을 정하면 얼마를 모을 수 있는지 알려드립니다.",
  },
];

export default function GoalSavingsCalc() {
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
  const [mode, setMode] = useState<GoalMode>("targetToMonthly");

  const has = (k: string) => !!state[k]?.value;

  const result = useMemo(() => {
    const rate = num("rate");
    if (!has("rate")) return null;

    if (mode === "targetToMonthly") {
      if (!has("target") || !has("months")) return null;
      return {
        mode,
        data: goalRequiredMonthly({
          targetAmount: won("target"),
          months: num("months"),
          annualRate: rate,
        }),
      } as const;
    }
    if (mode === "monthlyToMonths") {
      if (!has("monthly") || !has("target")) return null;
      return {
        mode,
        data: goalRequiredMonths({
          monthlyDeposit: won("monthly"),
          targetAmount: won("target"),
          annualRate: rate,
        }),
      } as const;
    }
    // monthlyAndMonthsToAmount
    if (!has("monthly") || !has("months")) return null;
    return {
      mode,
      data: goalFinalAmount({
        monthlyDeposit: won("monthly"),
        months: num("months"),
        annualRate: rate,
      }),
    } as const;
    // eslint-disable-next-line react-hooks/exhaustive-deps
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode]);

  const showTarget = mode === "targetToMonthly" || mode === "monthlyToMonths";
  const showMonthly = mode === "monthlyToMonths" || mode === "monthlyAndMonthsToAmount";
  const showMonths = mode === "targetToMonthly" || mode === "monthlyAndMonthsToAmount";

  const yearMonth = (m: number) => {
    const y = Math.floor(m / 12);
    const mm = m % 12;
    if (y === 0) return `${mm}개월`;
    if (mm === 0) return `${y}년`;
    return `${y}년 ${mm}개월`;
  };

  return (
    <div className="space-y-5">
      {/* 모드 선택 */}
      <div>
        <p className="mb-2 text-sm font-semibold text-slate-600">무엇을 구할까요?</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`rounded-xl border py-3 text-sm font-bold transition-all ${
                mode === m.value
                  ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-400">
          {MODES.find((m) => m.value === mode)?.hint}
        </p>
      </div>

      {showTarget && (
        <InputField
          label="목표 금액"
          name="target"
          suffix="만원"
          placeholder="예: 1,000"
          hint="단위: 만원 (1,000만 원 → 1,000)"
          value={state.target?.value ?? ""}
          error={state.target?.error}
          onChange={(v) => setValue("target", v)}
        />
      )}

      {showMonthly && (
        <InputField
          label="월 납입액"
          name="monthly"
          suffix="만원"
          placeholder="예: 30"
          hint="단위: 만원 (월 30만 원 → 30)"
          value={state.monthly?.value ?? ""}
          error={state.monthly?.error}
          onChange={(v) => setValue("monthly", v)}
        />
      )}

      {showMonths && (
        <InputField
          label="기간"
          name="months"
          suffix="개월"
          placeholder="예: 36"
          value={state.months?.value ?? ""}
          error={state.months?.error}
          onChange={(v) => setValue("months", v)}
        />
      )}

      <InputField
        label="예상 연이율"
        name="rate"
        suffix="%"
        step={0.1}
        placeholder="예: 3.0 (이자 없이 계획하려면 0)"
        value={state.rate?.value ?? ""}
        error={state.rate?.error}
        onChange={(v) => setValue("rate", v)}
      />

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 모드 A: 필요한 월 납입액 */}
          {result.mode === "targetToMonthly" && (
            <>
              <ResultCard
                label="필요한 월 납입액"
                value={formatKRW(result.data.requiredMonthly)}
                sub={`목표 ${formatUnit(result.data.targetAmount)} · ${yearMonth(
                  result.data.months,
                )}`}
                highlight
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ResultCard
                  label="총 납입 원금"
                  value={formatUnit(result.data.totalDeposit)}
                />
                <ResultCard
                  label="세전 이자"
                  value={formatKRW(result.data.totalInterest)}
                />
              </div>
            </>
          )}

          {/* 모드 B: 목표까지 걸리는 기간 */}
          {result.mode === "monthlyToMonths" && (
            <>
              <ResultCard
                label="목표까지 걸리는 기간"
                value={yearMonth(result.data.months)}
                sub={`총 ${result.data.months}개월`}
                highlight
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <ResultCard
                  label="실제 도달액"
                  value={formatUnit(result.data.reachedAmount)}
                />
                <ResultCard
                  label="총 납입 원금"
                  value={formatUnit(result.data.totalDeposit)}
                />
                <ResultCard
                  label="세전 이자"
                  value={formatKRW(result.data.totalInterest)}
                />
              </div>
              {result.data.capped && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-bold text-amber-900">
                    ⚠️ 목표 도달까지 매우 오래 걸립니다
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    현재 조건으로는 100년(1,200개월 이상) 안에 목표에 닿기 어렵습니다.
                    월 납입액을 늘리거나 목표 금액을 조정해 보세요.
                  </p>
                </div>
              )}
            </>
          )}

          {/* 모드 C: 예상 도달 금액 */}
          {result.mode === "monthlyAndMonthsToAmount" && (
            <>
              <ResultCard
                label="예상 도달 금액"
                value={formatUnit(result.data.finalAmount)}
                sub={`${yearMonth(result.data.months)} 후 · 세전`}
                highlight
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ResultCard
                  label="총 납입 원금"
                  value={formatUnit(result.data.totalDeposit)}
                />
                <ResultCard
                  label="세전 이자"
                  value={formatKRW(result.data.totalInterest)}
                />
              </div>
            </>
          )}

          <p className="text-xs leading-relaxed text-slate-400">
            ※ 월복리·매월 말 납입·세전 기준의 저축 계획 예상치입니다. 세금(이자소득세)과
            수수료, 중도 인출은 반영하지 않으므로 <strong>실제 금융상품의 세후 수령액과
            다를 수 있습니다.</strong> 상품별 세후 금액은 예금·적금 계산기에서 확인하세요.
          </p>
        </div>
      )}
    </div>
  );
}
