// src/components/calculator/CalcShell.tsx
import { WebAppJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { BASE_URL } from "@/lib/metadata";
import RelatedLinks, { type RelatedItem } from "./RelatedLinks";

export interface ExampleItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface CalcExample {
  title: string;
  desc: string;
  inputs: { label: string; value: string }[];
  results: ExampleItem[];
  note?: string;
}

interface CalcShellProps {
  title: string;
  description: string;
  icon: string;
  slug: string;
  calculator: React.ReactNode;
  guide?: React.ReactNode;
  faq?: { q: string; a: string }[];
  examples?: CalcExample[];
  /** 브레드크럼 오버라이드 — 부동산 계산기처럼 중간 단계가 있을 때 전달 */
  breadcrumb?: { name: string; url: string }[];
  /** 하단 관련 계산기 링크 */
  relatedCalcs?: RelatedItem[];
  /** 하단 관련 가이드 링크 */
  relatedGuides?: RelatedItem[];
}

export default function CalcShell({
  title, description, icon, slug, calculator, guide, faq, examples,
  breadcrumb, relatedCalcs, relatedGuides,
}: CalcShellProps) {
  const pageUrl = `${BASE_URL}/${slug}`;

  const crumbs = breadcrumb ?? [
    { name: "홈",   url: BASE_URL },
    { name: title, url: pageUrl  },
  ];

  return (
    <>
      {/* 구조화 데이터 */}
      <WebAppJsonLd name={title} description={description} url={pageUrl} />
      <BreadcrumbJsonLd items={crumbs} />
      {faq && faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faq.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── 브레드크럼 ── */}
        <nav
          aria-label="breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400"
        >
          {crumbs.map((crumb, i) => (
            <span key={crumb.url} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg
                  className="h-3 w-3 shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              )}
              {i < crumbs.length - 1 ? (
                <a href={crumb.url} className="transition-colors hover:text-brand-600">
                  {crumb.name}
                </a>
              ) : (
                <span className="font-semibold text-slate-600">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>

        {/* ── 페이지 헤더 ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">{icon}</span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">{title}</h1>
          </div>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl">{description}</p>
        </div>

        {/* ── 계산기 + 가이드 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8">
              {calculator}
            </div>
          </div>
          {guide && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-20">
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>📌</span> 이용 안내
              </h2>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">{guide}</div>
            </div>
          )}
        </div>

        {/* ── 계산 예시 ── */}
        {examples && examples.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-black text-slate-800 mb-5">계산 예시</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {examples.map((ex, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="bg-slate-50 border-b border-slate-100 px-5 py-4">
                    <p className="font-bold text-slate-800 text-sm">{ex.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ex.desc}</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        입력값
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {ex.inputs.map((inp, j) => (
                          <div key={j} className="flex items-center justify-between text-sm">
                            <span className="text-slate-500">{inp.label}</span>
                            <span className="font-semibold text-slate-800 tabular-nums">
                              {inp.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-100" />
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                        결과
                      </p>
                      <div className="space-y-1.5">
                        {ex.results.map((res, j) => (
                          <div
                            key={j}
                            className={`flex items-center justify-between text-sm rounded-lg px-3 py-1.5
                              ${res.highlight
                                ? "bg-brand-50 text-brand-800 font-bold"
                                : "text-slate-700"}`}
                          >
                            <span className={res.highlight ? "" : "text-slate-500"}>
                              {res.label}
                            </span>
                            <span className="tabular-nums">{res.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {ex.note && (
                      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
                        💬 {ex.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ── */}
        {faq && faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-black text-slate-800 mb-5">자주 묻는 질문</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details
                  key={i}
                  className="group bg-white border border-slate-100 rounded-xl overflow-hidden"
                >
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer
                                     font-semibold text-slate-800 text-sm select-none
                                     hover:bg-slate-50 transition-colors list-none">
                    <span>Q. {item.q}</span>
                    <svg
                      className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0 ml-3"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ── 내부 링크 (SEO) ── */}
        <RelatedLinks calculators={relatedCalcs} guides={relatedGuides} />

      </div>
    </>
  );
}
