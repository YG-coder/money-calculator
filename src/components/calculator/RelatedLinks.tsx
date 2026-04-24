// src/components/calculator/RelatedLinks.tsx
// 계산기 하단 내부 링크 섹션 — SEO 내부 링크 강화
// 신규 파일: 외부 라이브러리 없이 next/link만 사용
import Link from "next/link";

export interface RelatedItem {
  label: string;
  href: string;
  icon?: string;
}

interface RelatedLinksProps {
  calculators?: RelatedItem[];
  guides?: RelatedItem[];
}

export default function RelatedLinks({ calculators, guides }: RelatedLinksProps) {
  if (!calculators?.length && !guides?.length) return null;

  return (
    <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
      {calculators && calculators.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            🔗 관련 계산기
          </h3>
          <ul className="space-y-2">
            {calculators.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-brand-600"
                >
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span className="group-hover:underline underline-offset-2">
                    {item.label}
                  </span>
                  <svg
                    className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-brand-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guides && guides.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            📖 관련 금융 가이드
          </h3>
          <ul className="space-y-2">
            {guides.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors hover:text-brand-600"
                >
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span className="group-hover:underline underline-offset-2">
                    {item.label}
                  </span>
                  <svg
                    className="ml-auto h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-brand-400"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
