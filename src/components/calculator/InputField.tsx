"use client";

import { useId } from "react";

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  name?: string;
  inputMode?: "numeric" | "decimal";
}

export default function InputField({
  label, value, onChange, suffix, hint, error, min, max, step = 0.1,
  placeholder = "0", name, inputMode,
}: InputFieldProps) {
  const id = useId();
  const inputId = `calc-${name ?? "input"}-${id}`;
  const description = [
    suffix && `${inputId}-unit`,
    hint && `${inputId}-hint`,
    error && `${inputId}-error`,
  ].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-slate-600">{label}</label>
      <div className="relative flex items-center">
        <input
          type="text"
          id={inputId}
          inputMode={inputMode ?? (["만원", "개월", "년", "일"].includes(suffix ?? "") ? "numeric" : "decimal")}
          name={name}
          autoComplete="off"
          spellCheck={false}
          className={`
            w-full rounded-xl border bg-white
            px-4 py-3 pr-14 text-lg font-bold text-slate-800
            placeholder:text-slate-300 transition
            focus:outline-none focus:ring-2 focus:border-transparent
            ${error
              ? "border-red-300 focus:ring-red-400"
              : "border-slate-200 focus:ring-brand-400"}
          `}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          aria-invalid={!!error}
          aria-describedby={description}
        />
        {suffix && (
          <span id={`${inputId}-unit`} className="absolute right-4 text-sm font-medium text-slate-500 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-red-600">{error}</p>
      )}
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
