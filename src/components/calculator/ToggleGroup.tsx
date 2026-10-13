"use client";

import { useId } from "react";

// src/components/calculator/ToggleGroup.tsx
// DsrCalc 내부에 있던 토글 버튼 그룹을 공통 컴포넌트로 승격한 것. 구현·클래스 동일(디자인 변경 없음).
// LTV·실투자금·환전 계산기가 모두 같은 형태의 조건 토글을 쓰므로 복붙을 막기 위해 분리.

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

interface ToggleGroupProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  options: ToggleOption<T>[];
  onChange: (v: T) => void;
  gridClass?: string;
}

export default function ToggleGroup<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  gridClass = "grid-cols-2",
}: ToggleGroupProps<T>) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined}>
      <p id={`${id}-label`} className="mb-2 text-sm font-semibold text-slate-600">{label}</p>
      <div className={`grid gap-2 ${gridClass}`}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
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
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
