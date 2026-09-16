"use client";

import { useMemo, useState } from "react";
import { useCalcState } from "@/hooks/useCalcState";
import {
  readWon,
  readNum,
  isFilled,
  hasFieldErrorIn,
} from "@/lib/calcInput";
import { formatKRW, formatUnit } from "@/lib/loan";
import { calcEmergencyNeed, calcCoverageMonths } from "@/lib/funds";
import InputField from "@/components/calculator/InputField";
import ResultCard from "@/components/calculator/ResultCard";
import ToggleGroup from "@/components/calculator/ToggleGroup";

type Mode = "need" | "coverage";

const MODES: { value: Mode; label: string }[] = [
  { value: "need", label: "필요 금액 구하기" },
  { value: "coverage", label: "버틸 기간 구하기" },
];

const MAX_MAN = 100_000; // 10억원
const MAX_MONTHS = 600; // 50년

const overAmount = (v: string) =>
  v && Number(v) > MAX_MAN ? "금액을 다시 확인해주세요" : undefined;
const overMonths = (v: string) =>
  v && Number(v) > MAX_MONTHS ? "기간은 600개월 이하로 입력해주세요" : undefined;

const FIELDS = [
  { key: "essential", kind: "money" as const, defaultValue: "", validate: overAmount },
  { key: "months", kind: "integer" as const, defaultValue: "", validate: overMonths },
  { key: "available", kind: "money" as const, defaultValue: "", validate: overAmount },
];

export default function EmergencyFundCalc() {
  const { state, setValue } = useCalcState(FIELDS);
  const [mode, setMode] = useState<Mode>("need");

  // 거부된 입력과 상한 초과 등 검증 오류를 차단 사유로 본다.
  // 단 현재 모드에서 쓰는 입력만 본다. 숨겨진 대비기간의 오류가
  // '버틸 기간 구하기'를 막으면 안 된다.
  const activeKeys =
    mode === "need" ? ["essential", "months", "available"] : ["essential", "available"];
  const blocked = hasFieldErrorIn(state, activeKeys);

  /** 보유자금은 선택 입력이다. 미입력(null)과 0 원을 구분한다. */
  const availableWon = isFilled(state, "available")
    ? readWon(state, "available")
    : null;

  const need = useMemo(() => {
    if (blocked) return null;
    if (mode !== "need") return null;
    if (!isFilled(state, "essential") || !isFilled(state, "months")) return null;

    return calcEmergencyNeed({
      monthlyEssentialWon: readWon(state, "essential"),
      months: readNum(state, "months"),
      availableWon: isFilled(state, "available")
        ? readWon(state, "available")
        : null,
    });
  }, [state, mode, blocked]);

  const coverage = useMemo(() => {
    if (blocked) return null;
    if (mode !== "coverage") return null;
    if (!isFilled(state, "essential")) return null;

    return calcCoverageMonths({
      availableWon: isFilled(state, "available")
        ? readWon(state, "available")
        : null,
      monthlyEssentialWon: readWon(state, "essential"),
    });
  }, [state, mode, blocked]);

  const showMonths = mode === "need";
  const essentialFilled = isFilled(state, "essential");

  return (
    <div className="space-y-5">
      <ToggleGroup<Mode>
        label="무엇을 구할까요?"
        hint={
          mode === "need"
            ? "대비하고 싶은 기간을 정하면 필요한 금액을 계산합니다."
            : "지금 가진 돈으로 몇 달을 감당할 수 있는지 계산합니다."
        }
        value={mode}
        options={MODES}
        onChange={setMode}
      />

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-bold text-slate-800">이 계산기가 다루는 것</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          소득이 없는 기간의 <strong>필수지출</strong>을 얼마로 대비할지
          계산합니다. 차량·주택 수리나 갑작스러운 의료비처럼 사건별로 금액이
          정해지는 지출은 이 계산에 포함되지 않습니다.
        </p>
      </div>

      <InputField
        label="월 필수지출"
        name="essential"
        value={state.essential?.value ?? ""}
        onChange={(v) => setValue("essential", v)}
        suffix="만원"
        hint="소득이 없어도 계속 나가는 금액. 주거·식비·공과금·보험료 등"
        error={state.essential?.error}
      />

      {showMonths && (
        <InputField
          label="대비하고 싶은 기간"
          name="months"
          value={state.months?.value ?? ""}
          onChange={(v) => setValue("months", v)}
          suffix="개월"
          hint="직접 정하세요. 이 사이트는 적정 개월 수를 제시하지 않습니다"
          error={state.months?.error}
        />
      )}

      <InputField
        label={
          mode === "need"
            ? "현재 사용 가능한 자금 (선택)"
            : "현재 사용 가능한 자금"
        }
        name="available"
        value={state.available?.value ?? ""}
        onChange={(v) => setValue("available", v)}
        suffix="만원"
        hint={
          mode === "need"
            ? "입력하면 추가로 필요한 금액을 함께 계산합니다"
            : "바로 꺼내 쓸 수 있는 돈. 0원이면 0을 입력하세요"
        }
        error={state.available?.error}
      />

      {blocked && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          입력값에 확인이 필요한 항목이 있어 결과를 표시하지 않았습니다. 위에
          표시된 항목을 수정해 주세요.
        </p>
      )}

      {/* ── 모드 A ── */}
      {need && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="전체 필요자금"
              value={formatKRW(need.requiredWon)}
              sub={`월 ${formatUnit(need.monthlyEssentialWon)} × ${need.months}개월`}
              highlight={need.shortfallWon === null}
            />
            {need.shortfallWon !== null ? (
              <ResultCard
                label="추가로 필요한 금액"
                value={formatKRW(need.shortfallWon)}
                sub={
                  need.shortfallWon === 0
                    ? "보유자금으로 이미 채워집니다"
                    : `보유 ${formatUnit(need.availableWon ?? 0)}을 뺀 금액`
                }
                highlight={need.shortfallWon > 0}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-500">
                현재 사용 가능한 자금을 입력하면 추가로 필요한 금액을 함께
                계산합니다.
              </div>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <p>
              · 대비 기간은 입력하신 값을 그대로 사용했습니다. 이 사이트는 적정
              개월 수나 금액을 제시하지 않습니다.
            </p>
            <p>
              · 이자·물가 변동, 실업급여나 정부지원금은 반영하지 않습니다.
            </p>
          </div>
        </div>
      )}

      {/* ── 모드 B ── */}
      {coverage?.status === "ok" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ResultCard
              label="감당 가능한 기간"
              value={`${coverage.displayMonths.toFixed(1)}개월`}
              sub={
                coverage.years > 0
                  ? `약 ${coverage.years}년 ${coverage.remainMonths}개월`
                  : "소수 첫째 자리까지 내림"
              }
              highlight
            />
            <ResultCard
              label="월 필수지출"
              value={formatKRW(readWon(state, "essential"))}
              sub={`보유 ${formatKRW(availableWon ?? 0)} 기준`}
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <p>
              · 기간은 <strong>소수 첫째 자리까지 내림</strong>해 표시합니다.
              남는 금액을 한 달로 부풀리지 않기 위해서입니다.
            </p>
            <p>
              · 소득이 전혀 없고 월 필수지출이 그대로 유지된다는 가정입니다.
              이자·물가 변동과 실업급여·정부지원금은 반영하지 않습니다.
            </p>
          </div>
        </div>
      )}

      {coverage?.status === "cannotDivide" && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          월 필수지출이 0원이면 감당 가능한 기간을 계산할 수 없습니다. 매달 나가는
          금액을 입력해 주세요.
        </p>
      )}

      {mode === "coverage" &&
        !blocked &&
        essentialFilled &&
        availableWon === null && (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            현재 사용 가능한 자금을 입력하면 감당 가능한 기간을 계산합니다.
          </p>
        )}
    </div>
  );
}
