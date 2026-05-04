// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "about",
  title: "소개 — 머니계산기",
  description:
    "머니계산기는 대출이자, 원리금 상환, 전세대출, 취득세, 양도세 등 금융·부동산 계산을 누구나 이해할 수 있도록 돕는 무료 계산기 서비스입니다. 운영자, 콘텐츠 작성 원칙, 신뢰성 검증 방식까지 안내합니다.",
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

        {/* 1. 사이트 소개 */}
        <section>
          <p>
            <strong className="text-slate-900">머니계산기(머니계산기.kr)</strong>는
            대출이자, 원리금 상환, 전세대출, 취득세, 양도소득세, 재건축 분담금 등
            한국에서 자주 쓰이는 금융·부동산 계산을 누구나 쉽게 할 수 있도록
            만든 무료 계산기 서비스입니다. 별도의 회원가입 없이 바로 이용할 수
            있고, 입력값은 사용자의 브라우저 안에서만 처리됩니다.
          </p>
        </section>

        {/* 2. 왜 만들었나 */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-800">
            왜 만들었나
          </h2>
          <p className="mb-3">
            한국에서 주택을 매수하거나 대출을 받을 때 발생하는 비용은 매매가만큼
            중요한 의사결정 변수입니다. 그러나 실제로는 금리 0.5%p의 차이,
            상환 방식 선택, 보유 주택 수에 따른 세율 차이만으로도 수천만 원의
            부담이 달라질 수 있다는 사실이 충분히 알려져 있지 않습니다.
          </p>
          <p>
            머니계산기는 이런 &ldquo;숨어있는 차이&rdquo;를 직접 숫자로 확인하면서
            의사결정을 할 수 있도록 돕는 데 목적이 있습니다. 단순히 결과 숫자만
            보여주는 것이 아니라, 같은 조건에서 다른 변수를 바꿨을 때 어떻게
            달라지는지를 비교해볼 수 있는 시뮬레이션 환경을 제공하는 것을
            지향합니다.
          </p>
        </section>

        {/* 3. 운영자 정보 (E-E-A-T 핵심) */}
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-3 text-lg font-bold text-slate-800">
            운영자 정보
          </h2>
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
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            오류 제보, 계산 로직 개선 제안, 콘텐츠 수정 요청은 위 이메일로
            보내주시기 바랍니다. 영업일 기준 보통 48시간 이내에 회신합니다.
          </p>
        </section>

        {/* 4. 콘텐츠 작성·검증 원칙 (E-E-A-T 핵심) */}
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-800">
            콘텐츠 작성·검증 원칙
          </h2>
          <p className="mb-4">
            금융·세무 정보는 잘못된 안내가 사용자에게 직접적인 금전적 손해를
            줄 수 있는 영역입니다. 머니계산기는 이를 인식하고 다음 원칙에 따라
            콘텐츠를 작성·관리합니다.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-brand-600">①</span>
              <div>
                <strong className="text-slate-800">1차 출처 우선</strong> —
                세율·법령·금리 정보는 국세청, 한국은행, 금융감독원, 한국부동산원
                등 공식 기관 자료를 1차 출처로 삼습니다. 언론 보도만을 근거로
                숫자를 인용하지 않습니다.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-brand-600">②</span>
              <div>
                <strong className="text-slate-800">시점 명시</strong> — 세제와
                금융 정책은 자주 변경됩니다. 모든 글에는 작성 시점과 &ldquo;개정에
                따라 달라질 수 있다&rdquo;는 주의 문구를 명시합니다.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-brand-600">③</span>
              <div>
                <strong className="text-slate-800">단정적 조언 회피</strong> —
                개인의 재무 상황은 모두 다르므로 &ldquo;이렇게 하세요&rdquo;식
                단정 대신 &ldquo;이런 경우엔 이런 결과가 나올 수 있다&rdquo;는
                시뮬레이션 형식을 기본으로 합니다.
              </div>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 font-bold text-brand-600">④</span>
              <div>
                <strong className="text-slate-800">계산 검증</strong> — 모든
                계산기는 표준 공식(원리금균등 PMT, 만기일시 단순이자, 양도세
                과세표준 등)을 기준으로 작성하며, 시나리오 예시의 숫자는 직접
                재계산해 검증한 후 게시합니다.
              </div>
            </li>
          </ul>
        </section>

        {/* 5. 한계 (정직 신호) */}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-3 text-base font-bold text-amber-900">
            ⚠️ 본 사이트의 한계
          </h2>
          <p className="text-sm leading-relaxed text-amber-900">
            머니계산기는 일반적인 금융·세무 정보를 전달하는 정보 사이트이며,
            <strong> 개인 맞춤 금융 자문 서비스가 아닙니다</strong>. 제공되는
            계산 결과는 표준 공식에 기반한 시뮬레이션이며, 실제 금융기관의
            우대금리·가산금리·수수료, 개인 신용도, 우대 조건, 정책 변경 등에
            따라 실제 부담액과 차이가 있을 수 있습니다. 또한 특정 금융 상품을
            추천·판매하지 않으며, 광고 또는 제휴 관계가 콘텐츠 작성에 영향을
            주지 않습니다. 중요한 금융·세무 의사결정은 반드시 해당 금융기관
            또는 세무 전문가와 상담 후 진행하시기 바랍니다.
          </p>
        </section>

        {/* 6. 제공 기능 */}
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
              ["📐", "양도소득세 계산기", "양도차익·과세표준·예상 세액 계산"],
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

        {/* 7. 개인정보 */}
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
