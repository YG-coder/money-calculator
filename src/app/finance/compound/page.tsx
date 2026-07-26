// src/app/finance/compound/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import CompoundSavingsCalc from "@/components/calculator/CompoundSavingsCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/compound",
  title: "복리 계산기 — 원금·월 납입·기간별 복리 효과",
  description:
    "초기 원금과 월 추가 납입액, 예상 연이율, 기간을 입력하면 복리로 불어나는 최종 금액과 단리 대비 복리 효과, 연도별 잔액을 계산합니다.",
  keywords: ["복리계산기", "복리효과", "복리이자", "72의법칙", "적립식복리"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "복리 계산기", url: `${BASE_URL}/finance/compound` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "1,000만 원 · 3년 · 월복리",
    desc: "초기 1,000만원, 연 3.5%, 3년, 추가 납입 없음",
    inputs: [
      { label: "초기 원금", value: "1,000만원" },
      { label: "예상 연이율", value: "3.5%" },
      { label: "기간", value: "3년" },
      { label: "월 추가", value: "없음" },
    ],
    results: [
      { label: "총 납입 원금", value: "1,000만" },
      { label: "누적 이자(세전)", value: "1,105,409원", highlight: true },
      { label: "최종 금액(세전)", value: "1,110만" },
      { label: "단리 대비", value: "+55,409원" },
    ],
    note: "같은 조건 단리 가정은 1,105만 원입니다. 이자가 다시 이자를 낳아 3년만 지나도 약 5.5만 원 차이가 납니다.",
  },
  {
    title: "500만 원 + 매달 20만 원 · 10년",
    desc: "초기 500만원, 연 5%, 10년, 월 20만원 추가",
    inputs: [
      { label: "초기 원금", value: "500만원" },
      { label: "예상 연이율", value: "5%" },
      { label: "기간", value: "10년" },
      { label: "월 추가", value: "20만원" },
    ],
    results: [
      { label: "총 납입 원금", value: "2,900만" },
      { label: "누적 이자(세전)", value: "1,029만" },
      { label: "최종 금액(세전)", value: "3,929만", highlight: true },
      { label: "단리 대비", value: "+184만" },
    ],
    note: "총 2,900만 원을 넣어 세전 3,929만 원. 기간이 길고 매달 납입을 더하면 복리 효과(단리 대비 +184만 원)가 크게 벌어집니다.",
  },
];

const FAQ = [
  {
    q: "단리와 복리는 무엇이 다른가요?",
    a: "단리는 원금에만 이자가 붙습니다. 복리는 발생한 이자가 원금에 더해져 다음 이자 계산에 포함되므로 '이자가 이자를 낳는' 구조입니다. 기간이 짧거나 수익률이 낮으면 차이가 작지만, 기간이 길수록 복리 효과가 급격히 커집니다.",
  },
  {
    q: "72의 법칙이 무엇인가요?",
    a: "원금이 두 배가 되는 데 걸리는 대략의 기간을 '72 ÷ 연이율(%)'로 어림하는 방법입니다. 예를 들어 연 6%라면 약 12년, 연 4%라면 약 18년이 걸립니다. 복리 효과를 직관적으로 가늠할 때 유용합니다.",
  },
  {
    q: "복리 주기가 짧을수록 항상 유리한가요?",
    a: "같은 명목 수익률이라면 복리 횟수가 많을수록(연 1회보다 월 12회) 최종 금액이 조금 더 커집니다. 다만 실제 상품에서는 명목 금리와 조건을 함께 봐야 하며, 이 계산기는 월복리를 기준으로 합니다.",
  },
  {
    q: "이 계산기의 금액은 세전인가요, 세후인가요?",
    a: "세전 기준입니다. 실제 세후 수령액은 상품의 이자 지급 시점과 과세 방식, 비과세 적용 여부 및 금융기관의 원 단위 처리에 따라 달라집니다. 일반과세 상품은 이자소득 지급 시 통상 15.4%가 원천징수될 수 있으므로, 실제 수령액은 표시된 세전 금액보다 적을 수 있습니다. 예금·적금 상품의 세후 금액이 궁금하면 예금 이자 계산기, 적금 이자 계산기를 이용하세요.",
  },
  {
    q: "이 계산기로 투자 수익을 예측할 수 있나요?",
    a: "입력한 예상 연이율이 그대로 유지된다는 가정 아래의 예상치일 뿐, 미래 수익을 보장하지 않습니다. 예·적금 같은 확정금리 저축의 복리 효과를 가늠하는 용도로 보는 것이 안전합니다.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="복리 계산기"
        description="초기 원금과 월 추가 납입액, 예상 연이율, 기간을 입력하면 복리로 불어나는 최종 금액과 단리 대비 효과를 확인할 수 있습니다."
        icon="📈"
        slug="finance/compound"
        breadcrumb={crumbs}
        calculator={<CompoundSavingsCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">복리 계산기란?</h2>
            <p>
              복리 계산기는 초기 원금과 매달 추가로 넣는 금액이 복리로 어떻게
              불어나는지 계산하는 도구입니다. 예상 연이율과 기간을 입력하면 총 납입
              원금, 누적 이자, 최종 예상 금액과 함께 단리로 계산했을 때와의 차이,
              연도별 잔액을 보여 줍니다. 목돈을 한 번에 넣는{" "}
              <Link
                href="/finance/deposit"
                className="font-semibold text-brand-600 underline underline-offset-2"
              >
                예금
              </Link>
              이나 매달 넣는{" "}
              <Link
                href="/finance/installment-savings"
                className="font-semibold text-brand-600 underline underline-offset-2"
              >
                적금
              </Link>
              의 장기 복리 효과를 가늠할 때 유용합니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">복리의 힘</h2>
            <p>
              복리는 이자가 원금에 더해져 그 다음 이자 계산에 포함되는 방식입니다.
              시간이 짧으면 단리와 큰 차이가 없지만, 기간이 길어질수록 곡선이
              가팔라집니다. 예를 들어 500만 원에 매달 20만 원씩 10년간 연 5%로
              불리면, 총 납입 2,900만 원이 세전 약 3,929만 원이 되어 단리 대비 약
              184만 원이 더 쌓입니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">복리 계산 공식</h2>
            <div className="rounded bg-slate-100 p-4">
              <strong>
                최종 금액 = 원금 × (1 + 월수익률)<sup>개월</sup> + 월 납입액의 복리
                합계
              </strong>
              <br />
              (이 계산기는 월복리, 매달 말 추가 납입을 기준으로 합니다.)
            </div>

            <h2 className="text-xl font-bold text-slate-900">72의 법칙</h2>
            <p>
              원금이 두 배가 되는 기간은 대략 ‘72 ÷ 연이율’로 어림할 수 있습니다.
              연 6%라면 약 12년, 연 4%라면 약 18년입니다. 복리 효과를 직관적으로
              가늠할 때 참고하세요.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              세전 기준입니다 — 세금 유의
            </h2>
            <p>
              이 계산기의 결과는 세전 기준입니다. 실제 금융상품은 이자를 지급하는
              시점에 과세하며, 이자 지급 주기와 비과세 적용 여부, 금융기관의 원 단위
              처리에 따라 세후 수령액이 달라질 수 있습니다. 따라서 누적 이자에서
              세율을 한 번 차감한 값을 모든 상품에 공통적인 세후 복리 금액으로
              표시하지 않습니다. 확정금리 예·적금의 세후 금액이 궁금하다면 예금 이자
              계산기와 적금 이자 계산기를 이용하세요. 입력한 예상 연이율이 그대로
              유지된다는 가정의 예상치일 뿐, 미래 수익을 보장하지 않습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">계산 시 주의사항</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>기간은 정수 연 단위로 입력하세요. 연도별 잔액은 각 연말 기준입니다.</li>
              <li>월복리·기말 적립 기준의 세전 예상치입니다.</li>
              <li>
                실제 세후 수령액은 상품의 이자 지급 시점과 과세 조건(비과세 여부
                포함)에 따라 달라집니다.
              </li>
              <li>가정한 예상 연이율이 유지된다는 전제이며 미래 수익을 보장하지 않습니다.</li>
            </ul>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
          { label: "적금 이자 계산기", href: "/finance/installment-savings", icon: "🪙" },
          { label: "원리금상환 계산기", href: "/amortization-calculator", icon: "📊" },
        ]}
      />
    </Suspense>
  );
}
