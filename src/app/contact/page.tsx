import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "contact",
  title: "문의하기",
  description: "머니계산기 문의 및 피드백을 보내주세요.",
});

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-black text-slate-900">문의하기</h1>

      <p className="mb-8 text-sm text-slate-500">
        서비스 관련 문의, 오류 제보, 기능 개선 제안을 보내주세요.
      </p>

      <div className="space-y-5 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        {/* 이메일 */}
        <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
          <span className="shrink-0 text-2xl">📧</span>

          <div>
            <p className="mb-1 font-bold text-slate-800">이메일 문의</p>

            <a
              href="mailto:hygcorp0@gmail.com"
              className="font-semibold text-brand-600 underline-offset-2 hover:underline"
            >
              hygcorp0@gmail.com
            </a>

            <p className="mt-1 text-xs text-slate-400">
              영업일 기준 1~2일 내 답변드립니다.
            </p>
          </div>
        </div>

        {/* 버그 */}
        <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4">
          <span className="shrink-0 text-2xl">🐛</span>

          <div>
            <p className="mb-1 font-bold text-slate-800">
              버그 제보 / 기능 제안
            </p>

            <p className="text-sm text-slate-500">
              계산 오류, UI 문제, 새로운 계산기 요청 등 모든 피드백을
              환영합니다.
            </p>
          </div>
        </div>

        {/* 서비스 안내 */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            본 서비스는 무료로 제공되며, 금융 계산 결과는 참고용입니다. 실제
            금융 상품과 차이가 있을 수 있으므로 중요한 결정 전 반드시 금융기관을
            통해 확인하시기 바랍니다.
          </p>
        </div>

        {/* 안내 */}
        <p className="pt-2 text-center text-xs text-slate-400">
          문의 내용에 따라 답변이 지연될 수 있습니다.
        </p>
      </div>
    </div>
  );
}
