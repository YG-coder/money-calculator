"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import { formatKRW, formatUnit } from "@/lib/loan";
import {
  calcDsr,
  estimatePrincipalFromDsr,
  DSR_VERIFIED_DATE,
  LOCAL_MORTGAGE_DEFERRAL_UNTIL,
  type Region,
  type RateType,
  type DsrRepayment,
} from "@/lib/dsr";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";

type Mode = "check" | "estimate";

const FIELDS = [
  { key: "income", kind: "money" as const, defaultValue: "" },
  { key: "existingDebt", kind: "money" as const, defaultValue: "" },
  { key: "amount", kind: "money" as const, defaultValue: "" },
  { key: "rate", kind: "decimal" as const, defaultValue: "" },
  { key: "months", kind: "integer" as const, defaultValue: "" },
];

// 퍼센트 표기 시 부동소수점 잔여(예: 4.05000001) 정리
const trimPct = (n: number) => Number(n.toFixed(2));

// ── 내부 토글 그룹 (AmortizationCalc 버튼 그리드 패턴 재사용) ──
function ToggleGroup<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  gridClass = "grid-cols-2",
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  gridClass?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-600">{label}</p>
      <div className={`grid gap-2 ${gridClass}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-xl border py-3 text-sm font-bold transition-all ${
              value === o.value
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function DsrCalc() {
  const { state, setValue } = useCalcState(FIELDS);

  // ⚠️ 반응성: useCalcState의 getWon/getNum은 useEffect로 한 박자 뒤에 갱신되는
  // latestStateRef를 읽어, 마지막 입력 시점에 stale 값이 잡힌다. useMemo는 state에
  // 의존해 렌더 중 실행되므로, 여기서는 현재 렌더의 state.raw를 직접 읽는다.
  const won = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n * 10_000;
  };
  const num = (key: string): number => {
    const n = Number(state[key]?.raw ?? "0");
    return isNaN(n) ? 0 : n;
  };

  const [mode, setMode] = useState<Mode>("check");
  const [region, setRegion] = useState<Region>("metro");
  const [rateType, setRateType] = useState<RateType>("variable");
  const [repayment, setRepayment] = useState<DsrRepayment>("equal_payment");
  const [limitPercent, setLimitPercent] = useState<40 | 50>(40);

  // 금리 0%는 유효한 입력이므로 truthy 검사 대신 빈 문자열 여부로 판정
  const rateFilled = (state.rate?.raw ?? "") !== "";

  const checkResult = useMemo(() => {
    if (mode !== "check") return null;
    const income = won("income");
    const amount = won("amount");
    const months = num("months");
    if (!income || !amount || !months || !rateFilled) return null;

    return calcDsr({
      annualIncome: income,
      existingAnnualDebt: won("existingDebt"),
      newPrincipal: amount,
      ratePercent: num("rate"),
      months,
      repayment,
      region,
      rateType,
      limitPercent,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, region, rateType, repayment, limitPercent, rateFilled]);

  const estimateResult = useMemo(() => {
    if (mode !== "estimate") return null;
    const income = won("income");
    const months = num("months");
    if (!income || !months || !rateFilled) return null;

    return estimatePrincipalFromDsr({
      annualIncome: income,
      existingAnnualDebt: won("existingDebt"),
      limitPercent,
      ratePercent: num("rate"),
      months,
      region,
      rateType,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, mode, region, rateType, limitPercent, rateFilled]);

  return (
    <div className="space-y-5">
      {/* ── 모드 ── */}
      <ToggleGroup<Mode>
        label="계산 모드"
        value={mode}
        onChange={setMode}
        options={[
          { value: "check", label: "DSR 확인" },
          { value: "estimate", label: "추정 가능액" },
        ]}
      />
      <p className="-mt-3 text-xs text-slate-400">
        {mode === "check"
          ? "입력한 신규 대출 기준으로 현재 DSR과 스트레스 DSR을 확인합니다."
          : "소득과 목표 DSR로 DSR 기준 추정 가능 대출액을 역산합니다. 추정 가능액은 원리금균등 상환 기준으로 역산합니다."}
      </p>

      {/* ── 공통 입력 ── */}
      <InputField
        label="연 소득 (세전)"
        name="income"
        suffix="만원"
        placeholder="예: 5,000"
        hint="단위: 만원"
        value={state.income?.value ?? ""}
        onChange={(v) => setValue("income", v)}
      />

      <InputField
        label="기존 대출 연간 원리금 (선택)"
        name="existingDebt"
        suffix="만원"
        placeholder="예: 600"
        hint="기존 대출의 DSR 산정용 연간 원리금 상환액. 금융회사 앱·상담자료에서 확인한 값이 가장 정확합니다. 없으면 비워두세요."
        value={state.existingDebt?.value ?? ""}
        onChange={(v) => setValue("existingDebt", v)}
      />

      {/* ── 대출 조건 (주택담보대출 기준) ── */}
      <ToggleGroup<Region>
        label="지역"
        value={region}
        onChange={setRegion}
        options={[
          { value: "metro", label: "수도권·규제지역" },
          { value: "local", label: "지방(비규제)" },
        ]}
        hint={`지방 주담대는 ${LOCAL_MORTGAGE_DEFERRAL_UNTIL}까지 2단계(스트레스 0.75%)가 유예 적용됩니다.`}
      />

      <ToggleGroup<RateType>
        label="금리 유형"
        value={rateType}
        onChange={setRateType}
        options={[
          { value: "variable", label: "변동형" },
          { value: "fixed", label: "순수고정형" },
        ]}
        hint="혼합형·주기형은 고정기간·변동주기에 따라 적용비율이 달라 현재 간편 계산에서는 지원하지 않습니다."
      />

      <div className="grid grid-cols-2 gap-3">
        <InputField
          label="대출 금리"
          name="rate"
          suffix="%"
          step={0.1}
          placeholder="예: 4.5"
          value={state.rate?.value ?? ""}
          onChange={(v) => setValue("rate", v)}
        />
        <InputField
          label="대출 기간"
          name="months"
          suffix="개월"
          placeholder="예: 360"
          value={state.months?.value ?? ""}
          onChange={(v) => setValue("months", v)}
        />
      </div>

      {mode === "check" && (
        <>
          <InputField
            label="신규 대출 금액"
            name="amount"
            suffix="만원"
            placeholder="예: 30,000"
            hint="단위: 만원"
            value={state.amount?.value ?? ""}
            onChange={(v) => setValue("amount", v)}
          />
          <ToggleGroup<DsrRepayment>
            label="상환 방식"
            value={repayment}
            onChange={setRepayment}
            options={[
              { value: "equal_payment", label: "원리금균등" },
              { value: "equal_principal", label: "원금균등" },
            ]}
            hint="만기일시·거치식은 원금 인정만기 규정이 별도라 현재 지원하지 않습니다."
          />
        </>
      )}

      <ToggleGroup<string>
        label={mode === "check" ? "선택한 DSR 기준" : "목표 DSR"}
        value={String(limitPercent)}
        onChange={(v) => setLimitPercent(Number(v) as 40 | 50)}
        options={[
          { value: "40", label: "은행권 40%" },
          { value: "50", label: "비은행 50%" },
        ]}
      />

      {/* ── 결과: DSR 확인 ── */}
      {mode === "check" && checkResult && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard label="일반 DSR" value={`${checkResult.dsrNormal.toFixed(1)}%`} />
            <ResultCard
              label="스트레스 DSR"
              value={`${checkResult.dsrStressed.toFixed(1)}%`}
              sub={
                checkResult.effectiveStressRate > 0
                  ? `적용금리 ${trimPct(
                      checkResult.stressedRatePercent,
                    )}% (명목 ${trimPct(
                      checkResult.stressedRatePercent -
                        checkResult.effectiveStressRate,
                    )}% + 스트레스 ${trimPct(
                      checkResult.effectiveStressRate,
                    )}%p)`
                  : "스트레스 금리 미적용 (순수고정)"
              }
              highlight={!checkResult.exceeded}
              danger={checkResult.exceeded}
            />
          </div>

          <div
            className={`rounded-2xl border p-4 text-sm ${
              checkResult.exceeded
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {checkResult.exceeded ? (
              <p>
                스트레스 DSR이 선택한 기준({limitPercent}%)을{" "}
                <strong>{checkResult.exceedByPct.toFixed(1)}%p</strong> 초과합니다.
              </p>
            ) : (
              <p>
                선택한 기준({limitPercent}%)까지 남은 연간 상환여력은 약{" "}
                <strong>{formatUnit(checkResult.headroomAnnual)}</strong>입니다.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── 결과: 추정 가능액 ── */}
      {mode === "estimate" && estimateResult && (
        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 pt-2 duration-300">
          {estimateResult.availableForNew <= 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              기존 부채가 이미 목표 DSR({limitPercent}%) 한도에 도달해, DSR 기준
              추정 가능액이 없습니다.
            </div>
          ) : (
            <>
              <ResultCard
                label="DSR 기준 추정 가능 대출액"
                value={formatUnit(estimateResult.estimatedPrincipal)}
                sub={`원리금균등 · 스트레스 금리 ${trimPct(estimateResult.stressedRatePercent)}% 기준`}
                highlight
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ResultCard
                  label="참고 · 월 상환액"
                  value={formatKRW(estimateResult.monthlyPaymentActual)}
                  sub="실제 금리 기준 원리금균등"
                />
                <ResultCard
                  label="연간 상환여력"
                  value={formatUnit(estimateResult.availableForNew)}
                  sub="목표 DSR − 기존 원리금"
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 고지 ── */}
      <div className="space-y-2 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-400">
        <p>
          ※ 이 계산기는 주택담보대출 기준입니다. 스트레스 DSR 기준일:{" "}
          {DSR_VERIFIED_DATE}. 규제는 수시로 바뀌므로 실제 적용 기준은
          금융위원회·전국은행연합회 공시로 확인하세요.
        </p>
        <p>
          ※ DSR 분자(연간 원리금)는 실제 상환액과 다를 수 있으며, 대출종류·상환방식에
          따라 산정방식이 달라집니다. 이 계산기는 신규 주택담보대출을
          원리금균등·원금균등 기준으로 산정한 참고용 추정치입니다.
        </p>
        {mode === "estimate" && (
          <p>
            ※ &lsquo;DSR 기준 추정 가능액&rsquo;은 DSR만으로 역산한 추정치입니다.
            실제 금융회사 한도는 LTV·담보가치·방공제·소득 인정방식·기존 부채
            산정방식 및 금융회사 심사에 따라 달라질 수 있으며, 최대 대출 가능액을
            보장하지 않습니다.
          </p>
        )}
      </div>
    </div>
  );
}
