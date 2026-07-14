// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "about",
  title: "소개 — 머니계산기",
  description:
      "머니계산기는 대출이자, 원리금 상환, 전세대출, 취득세, 월세 vs 전세, 부동산 수익률 등 금융·부동산 계산을 누구나 이해할 수 있도록 돕는 무료 계산기 서비스입니다.",
});

export default function Page() {
  return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="mb-2 text-3xl font-black text-slate-900">
          머니계산기 소개
        </h1>
        <p className="mb-8 text-sm text-slate-400">
          머니계산기.kr · 한국 금융·부동산 계산 전문
        </p>

        <div className="space-y-8 rounded-2xl border border-slate-100 bg-white p-8 text-[15px] leading-relaxed text-slate-600 shadow-sm">
          <section>
            <p>
              <strong className="text-slate-900">머니계산기(머니계산기.kr)</strong>는
              대출이자, 원리금 상환, 전세대출, 취득세, 월세 vs 전세, 부동산 수익률,
              재건축 분담금 등 한국에서 자주 쓰이는 금융·부동산 계산을 누구나 쉽게
              할 수 있도록 만든 무료 계산기 서비스입니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-800">왜 만들었나</h2>
            <p className="mb-3">
              한국에서 주택을 매수하거나 대출을 받을 때 발생하는 비용은 매매가만큼
              중요한 의사결정 변수입니다. 금리, 상환 방식, 보유 비용, 임대 수익률
              차이만으로도 실제 부담과 수익은 크게 달라질 수 있습니다.
            </p>
            <p>
              머니계산기는 이런 차이를 직접 숫자로 확인하면서 의사결정을 할 수 있도록
              돕는 데 목적이 있습니다.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="mb-3 text-lg font-bold text-slate-800">운영자 정보</h2>
            <dl className="space-y-3 text-sm">
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="font-semibold text-slate-500">운영</dt>
                <dd className="text-slate-700">
                  <strong className="text-slate-900">Incomelab</strong> (인컴랩)
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="font-semibold text-slate-500">분야</dt>
                <dd className="text-slate-700">
                  금융·부동산 계산기 개발 및 정보 콘텐츠 운영
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="font-semibold text-slate-500">문의</dt>
                <dd className="text-slate-700">
                  <a
                      href="mailto:support@머니계산기.kr"
                      className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
                  >
                    support@머니계산기.kr
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-4">
                <dt className="font-semibold text-slate-500">개시일</dt>
                <dd className="text-slate-700">2026년 4월</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              콘텐츠 작성·검증 원칙
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-600">①</span>
                <div>
                  <strong className="text-slate-800">1차 출처 우선</strong> —
                  세율·법령·금리 정보는 공식 기관 자료를 우선 참고합니다.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-600">②</span>
                <div>
                  <strong className="text-slate-800">시점 명시</strong> —
                  세제와 금융 정책은 변경될 수 있으므로 작성 시점과 주의 문구를 명시합니다.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-600">③</span>
                <div>
                  <strong className="text-slate-800">단정적 조언 회피</strong> —
                  특정 선택을 권유하지 않고 시뮬레이션 결과를 참고용으로 제공합니다.
                </div>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 font-bold text-brand-600">④</span>
                <div>
                  <strong className="text-slate-800">계산 검증</strong> —
                  계산 공식과 예시 수치를 직접 확인한 뒤 게시합니다.
                </div>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-3 text-base font-bold text-amber-900">
              ⚠️ 본 사이트의 한계
            </h2>
            <p className="text-sm leading-relaxed text-amber-900">
              머니계산기는 일반적인 금융·부동산 정보를 전달하는 정보 사이트이며,
              <strong> 개인 맞춤 금융 자문 서비스가 아닙니다</strong>. 제공되는 계산
              결과는 표준 공식에 기반한 참고용 시뮬레이션입니다.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-800">제공 기능</h2>
            <ul className="space-y-2.5 text-sm">
              {[
                ["🏦", "대출이자 계산기", "만기일시상환 기준 월 이자 및 총 이자 계산"],
                ["📊", "원리금상환 계산기", "원리금균등·원금균등 방식 비교"],
                ["🏠", "전세대출 계산기", "대출 한도 및 월 이자 계산"],
                ["💸", "중도상환 계산기", "수수료 포함 실제 절약 금액 계산"],
                ["🏠", "취득세 계산기", "1·2·3주택 가격대별 세율 자동 적용"],
                ["⚖️", "월세 vs 전세 계산기", "기회비용 기준 실질 비용 비교"],
                ["📈", "부동산 수익률 계산기", "월세 수익률·순수익·자기자본 수익률 계산"],
                ["🏗️", "재건축 분담금 계산기", "권리가액·비례율 기반 분담금 추정"],
              ].map(([icon, title, desc]) => (
                  <li key={title} className="flex items-start gap-3">
                    <span className="shrink-0 text-lg">{icon}</span>
                    <div>
                      <span className="font-semibold text-slate-800">{title}</span>
                      <span className="ml-2 text-slate-500">{desc}</span>
                    </div>
                  </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              상세 가이드는{" "}
              <Link
                  href="/blog"
                  className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                금융 가이드
              </Link>
              에서, 자세한 면책 사항은{" "}
              <Link
                  href="/disclaimer"
                  className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                면책 고지
              </Link>
              에서 확인하실 수 있습니다.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="mb-2 text-sm font-bold text-slate-800">
              🔒 개인정보 보호
            </h3>
            <p className="text-xs leading-relaxed text-slate-500">
              모든 계산은 사용자의 브라우저에서 처리되며, 입력하신 금액·금리·기간
              등의 데이터는 서버로 전송되거나 저장되지 않습니다. 자세한 사항은{" "}
              <Link
                  href="/privacy-policy"
                  className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
              >
                개인정보처리방침
              </Link>
              을 참고해주세요.
            </p>
          </section>
        </div>
      </div>
  );
}