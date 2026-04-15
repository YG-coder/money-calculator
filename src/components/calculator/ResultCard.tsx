interface ResultCardProps {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  danger?: boolean;
}

export default function ResultCard({ label, value, sub, highlight, danger }: ResultCardProps) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-1 border
      ${highlight ? "bg-brand-600 border-brand-700 text-white"
        : danger   ? "bg-red-50 border-red-200 text-slate-800"
        : "bg-slate-50 border-slate-200 text-slate-800"}`}>
      <p className={`text-xs font-semibold tracking-widest uppercase
        ${highlight ? "text-brand-200" : "text-slate-400"}`}>{label}</p>
      <p className={`text-2xl font-black tabular-nums leading-tight
        ${highlight ? "text-white" : danger ? "text-red-600" : "text-slate-900"}`}>{value}</p>
      {sub && (
        <p className={`text-xs mt-0.5 ${highlight ? "text-brand-200" : "text-slate-500"}`}>{sub}</p>
      )}
    </div>
  );
}
