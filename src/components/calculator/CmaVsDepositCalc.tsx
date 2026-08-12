"use client";

import { useMemo } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW } from "@/lib/loan";
import { compareCmaVsDeposit } from "@/lib/finance";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

const FIELDS = [
  { key: "principal", kind: "money" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
  { key: "depositRate", kind: "decimal" as const, defaultValue: "" },
  { key: "cmaRate", kind: "decimal" as const, defaultValue: "" },
];

export default function CmaVsDepositCalc() {
  const { state, setValue } = useCalcState(FIELDS);

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
    const principal = won("principal");
    const months = num("months");
    if (!principal || !months || !filled("depositRate") || !filled("cmaRate"))
      return null;

    return compareCmaVsDeposit({
      principal,
      months,
      depositRate: num("depositRate"),
      cmaRate: num("cmaRate"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-5">
      <InputField
        label="예치 금액"
        name="principal"
        suffix="만원"
        placeholder="예: 1,000"
        hint="단위: 만원. 예금·CMA 모두 이 금액을 처음부터 예치했다고 가정합니다."
        value={state.principal?.value ?? ""}
        onChange={(v) => setValue("principal", v)}
      />

      <InputField
        label="기간"
        name="months"
        suffix="개월"
        placeholder="예: 12"
        value={state.months?.value ?? ""}
        onChange={(v) => setValue("months", v)}
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="예금 금리"
          name="depositRate"
          suffix="%"
          step={0.1}
          placeholder="예: 3.5"
          value={state.depositRate?.value ?? ""}
          onChange={(v) => setValue("depositRate", v)}
        />
        <InputField
          label="CMA 예상수익률"
          name="cmaRate"
          suffix="%"
          step={0.1}
          placeholder="예: 3.0"
          value={state.cmaRate?.value ?? ""}
          onChange={(v) => setValue("cmaRate", v)}
        />
      </div>

      <p className="-mt-2 text-xs text-slate-400">
        두 값 모두 단리 일시예치·일반과세(15.4%) 기준으로 비교합니다. CMA
        예상수익률은 확정금리가 아니라 &lsquo;입력한 수익률이 유지된다면&rsquo;을
        가정한 값입니다.
      </p>

      {result && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {/* 세후 만기 수령액 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="예금 세후 수령액"
              value={formatKRW(result.deposit.maturityAmount)}
              sub={`세후이자 ${formatKRW(result.deposit.netInterest)} · 원금 대비 ${result.depositNetInterestRate.toFixed(2)}%`}
            />
            <ResultCard
              label="CMA 세후 수령액 (가정)"
              value={formatKRW(result.cma.maturityAmount)}
              sub={`세후이자 ${formatKRW(result.cma.netInterest)} · 원금 대비 ${result.cmaNetInterestRate.toFixed(2)}%`}
            />
          </div>

          {/* 세전 이자·세금 상세 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="예금 세전 이자"
              value={formatKRW(result.deposit.grossInterest)}
              sub={`이자과세 ${formatKRW(result.deposit.tax)} 차감`}
            />
            <ResultCard
              label="CMA 세전 이자 (가정)"
              value={formatKRW(result.cma.grossInterest)}
              sub={`이자과세 ${formatKRW(result.cma.tax)} 차감`}
            />
          </div>

          {/* 수령액 차이 (중립) */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-center text-sm text-slate-700">
            {result.maturityDiff > 0 ? (
              <p>
                입력한 수익률 기준, CMA 세후 수령액이 예금보다{" "}
                <strong className="text-brand-700">
                  {formatKRW(result.maturityDiff)}
                </strong>{" "}
                많습니다.
              </p>
            ) : result.maturityDiff < 0 ? (
              <p>
                입력한 수익률 기준, CMA 세후 수령액이 예금보다{" "}
                <strong className="text-brand-700">
                  {formatKRW(-result.maturityDiff)}
                </strong>{" "}
                적습니다.
              </p>
            ) : (
              <p>예금 금리와 CMA 예상수익률이 같아, 세후 수령액도 같습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ CMA 예상수익률은 확정금리가 아닙니다. CMA는 RP형·MMF형·MMW형·발행어음형
          등 상품 유형과 증권사·시장 상황에 따라 실제 수익률과 산정·지급 방식이
          달라질 수 있습니다. 이 계산기는 입력한 수익률이 기간 동안 유지된다고
          가정한 참고용 비교입니다.
        </p>
        <p>
          ※ 예금은 만기까지 금리가 유지되는 단리 일시예치를 가정하며, 두 값 모두
          일반과세 15.4%를 적용했습니다. 어느 쪽이 유리한지는 판단하지 않습니다.
        </p>
      </div>
    </div>
  );
}
