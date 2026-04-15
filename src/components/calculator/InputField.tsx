"use client";

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
}

export default function InputField({
  label, value, onChange, suffix, hint, error, min, max, step = 0.1,
  placeholder = "0", name,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-slate-600">{label}</label>
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          name={name}
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
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        />
        {suffix && (
          <span className="absolute right-4 text-sm font-medium text-slate-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-500">{error}</p>
      )}
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
