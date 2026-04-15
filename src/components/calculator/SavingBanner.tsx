"use client";

interface SavingBannerProps {
  message: string;
  isProfit?: boolean;
}

export default function SavingBanner({ message, isProfit = true }: SavingBannerProps) {
  return (
    <div className={`rounded-2xl p-5 flex items-start gap-3 border-2
      ${isProfit ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
      <span className="text-xl shrink-0">{isProfit ? "💡" : "⚠️"}</span>
      <p className={`text-sm font-semibold leading-relaxed
        ${isProfit ? "text-emerald-800" : "text-amber-800"}`}>{message}</p>
    </div>
  );
}
