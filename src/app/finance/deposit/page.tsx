// src/app/finance/deposit/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import DepositInterestCalc from "@/components/calculator/DepositInterestCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/deposit",
  title: "예금 이자 계산기 — 세전·세후 이자와 만기 수령액",
  description:
    "예치금·금리·기간을 입력하면 세전 이자, 이자과세, 세후 이자와 만기 수령액을 계산합니다. 단리·월복리 비교와 세후 연환산 수익률까지 한 번에 확인하세요.",
  keywords: ["예금이자계산기", "정기예금계산기", "예금이자", "세후이자", "만기수령액"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "예금 이자 계산기", url: `${BASE_URL}/finance/deposit` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "1,000만 원 · 1년 정기예금",
    desc: "1,000만원, 연 3.5%, 12개월, 단리, 일반과세",
    inputs: [
      { label: "예치금", value: "1,000만원" },
      { label: "금리", value: "연 3.5%" },
      { label: "기간", value: "12개월" },
      { label: "방식", value: "단리" },
    ],
    results: [
      { label: "세전 이자", value: "350,000원" },
      { label: "이자과세(15.4%)", value: "53,900원" },
      { label: "세후 이자", value: "296,100원", highlight: true },
      { label: "만기 수령액", value: "1,029만" },
    ],
    note: "세후 연환산 수익률 약 2.96%. 표시 금리 3.5%에서 세금 15.4%를 빼면 실제 손에 쥐는 수익률은 이만큼 낮아집니다.",
  },
  {
    title: "2,000만 원 · 2년 · 월복리",
    desc: "2,000만원, 연 4.0%, 24개월, 월복리, 일반과세",
    inputs: [
      { label: "예치금", value: "2,000만원" },
      { label: "금리", value: "연 4.0%" },
      { label: "기간", value: "24개월" },
      { label: "방식", value: "월복리" },
    ],
    results: [
      { label: "세전 이자", value: "1,662,859원" },
      { label: "세후 이자", value: "1,406,779원", highlight: true },
      { label: "만기 수령액", value: "2,141만" },
      { label: "세후 연환산", value: "3.46%" },
    ],
    note: "같은 조건을 단리로 계산하면 세전 이자가 160만 원입니다. 월복리가 약 6.3만 원 더 많은데, 기간이 길수록 이 차이는 더 벌어집니다.",
  },
];

const FAQ = [
  {
    q: "예금 이자는 어떻게 계산되나요?",
    a: "만기일시지급 단리는 '원금 × 연이율 × (개월/12)'로 계산합니다. 월복리는 매달 이자가 원금에 더해져 다음 달 이자에 포함되므로 '원금 × (1 + 월이율)^개월 − 원금'이 됩니다. 기간이 짧거나 금리가 낮으면 두 방식의 차이는 작고, 기간이 길수록 커집니다.",
  },
  {
    q: "표시 금리와 실제 수령액은 왜 다른가요?",
    a: "은행이 안내하는 연 금리는 보통 세전입니다. 일반과세 예금은 이자에서 이자소득세 15.4%(소득세 14% + 지방소득세 1.4%)가 원천징수되므로, 실제로 받는 세후 이자는 세전 이자보다 그만큼 줄어듭니다.",
  },
  {
    q: "세후 연환산 수익률은 무엇인가요?",
    a: "세금을 뺀 실제 수익을 1년 기준으로 환산한 값입니다. 단순히 기간으로 나눈 값이 아니라 '(세후 만기수령액 / 원금)^(12/개월) − 1' 형태의 기하 연환산이라, 기간이 1년을 넘거나 월복리일 때도 서로 다른 예금을 공정하게 비교할 수 있습니다.",
  },
  {
    q: "예금자보호는 얼마까지 되나요?",
    a: "현재 안내 기준으로 예금자보호는 원금과 소정의 이자를 합해 금융회사별 1인당 1억 원까지입니다. 여러 예금을 한 금융회사에 넣으면 합산되므로, 보호 한도를 넘는 자금은 금융회사를 나누는 것도 방법입니다. 보호 대상 상품·기관은 예금보험공사 안내를 확인하세요.",
  },
  {
    q: "계산 결과가 은행 실제 지급액과 다를 수 있나요?",
    a: "네, 참고용 예상치입니다. 실제 지급액은 원천징수 시 원 단위 처리 방식, 우대금리 충족 여부, 중도해지 시 낮아지는 이율, 이자 지급 주기 등에 따라 달라질 수 있습니다. 정확한 금액은 가입 상품의 약관과 금융기관 안내로 확인하세요.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="예금 이자 계산기"
        description="예치금·금리·기간을 입력하면 세전·세후 이자와 만기 수령액을 바로 확인할 수 있습니다."
        icon="🏦"
        slug="finance/deposit"
        breadcrumb={crumbs}
        calculator={<DepositInterestCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              예금 이자 계산기란?
            </h2>
            <p>
              예금 이자 계산기는 목돈을 한 번에 예치했을 때 만기에 받게 될 이자와
              수령액을 미리 계산하는 도구입니다. 예치금, 연 금리, 예치 기간을
              입력하면 세전 이자에서 이자소득세를 뺀 세후 이자와 최종 만기
              수령액까지 한눈에 확인할 수 있습니다. 목돈을 매달 나눠 넣는{" "}
              <Link
                href="/finance/installment-savings"
                className="font-semibold text-brand-600 underline underline-offset-2"
              >
                적금
              </Link>
              과 달리, 예금은 처음부터 전체 원금이 예치 기간 내내 이자를 받는다는
              점이 다릅니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">예금 이자 계산 공식</h2>
            <div className="rounded bg-slate-100 p-4">
              <strong>단리(만기일시지급)</strong> = 원금 × 연이율 × (개월 ÷ 12)
              <br />
              <strong>월복리</strong> = 원금 × (1 + 연이율 ÷ 12)<sup>개월</sup> −
              원금
            </div>
            <p>
              예를 들어 1,000만 원을 연 3.5%로 12개월 예치하면 단리 기준 세전
              이자는 35만 원입니다. 여기에 일반과세 15.4%가 적용되면 세금 53,900원,
              세후 이자는 296,100원이 됩니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              단리와 월복리, 무엇이 다를까
            </h2>
            <p>
              단리는 원금에만 이자가 붙습니다. 월복리는 매달 발생한 이자가 원금에
              더해져 다음 달 이자 계산에 포함되므로, 같은 금리라도 만기 이자가 조금
              더 많아집니다. 기간이 짧고 금리가 낮으면 차이가 미미하지만, 예치
              기간이 길수록 복리 효과가 커집니다. 다만 실제 정기예금은 만기일시지급
              단리 상품이 많으므로, 가입하려는 상품이 어떤 방식인지 먼저 확인하는
              것이 좋습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              세전 금리와 세후 수령액
            </h2>
            <p>
              은행에서 보는 연 3.5%는 보통 세전 금리입니다. 일반과세 예금은 이자에서
              이자소득세 15.4%(소득세 14% + 지방소득세 1.4%)가 원천징수되므로, 실제
              손에 쥐는 금액은 세전보다 줄어듭니다. 이 계산기는 세전 이자, 이자과세,
              세후 이자, 만기 수령액을 분리해 보여 주기 때문에 실제 수익을 기준으로
              상품을 비교할 수 있습니다. 비과세는 비과세종합저축 등 법령이 정한
              자격·상품 조건을 충족해야 적용되며, 누구나 임의로 선택하는 옵션이
              아닙니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">계산 시 주의사항</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                세금은 일반 세율을 적용한 예상치입니다. 실제 원천징수 시 원 단위
                처리 방식에 따라 소액 차이가 날 수 있습니다.
              </li>
              <li>
                표시 금리가 기본금리인지, 급여이체·카드실적 등 우대 조건을 채워야
                받는 우대금리 포함인지 확인하세요.
              </li>
              <li>
                만기 전 중도해지하면 약정 금리가 아닌 중도해지 이율이 적용되어 이자가
                크게 줄어듭니다.
              </li>
              <li>
                예금자보호는 원금과 소정의 이자를 합해 금융회사별 1인당 1억 원까지
                입니다. 보호 대상 상품·기관은 예금보험공사 안내를 확인하세요.
              </li>
            </ul>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">예금 200% 활용 팁</p>
              <p className="mt-2">
                목돈은 예금, 매달 저축은 적금, 장기 재투자 효과는 복리 계산기로
                나눠서 확인하면 내 자금 계획에 가장 잘 맞는 방식을 고를 수 있습니다.
                세후 연환산 수익률로 비교하면 기간이 다른 상품도 공정하게 견줄 수
                있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "적금 이자 계산기", href: "/finance/installment-savings", icon: "🪙" },
          { label: "복리 계산기", href: "/finance/compound", icon: "📈" },
          { label: "대출이자 계산기", href: "/loan-interest-calculator", icon: "🏦" },
        ]}
      />
    </Suspense>
  );
}
