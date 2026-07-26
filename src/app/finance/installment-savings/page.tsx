// src/app/finance/installment-savings/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import InstallmentSavingsCalc from "@/components/calculator/InstallmentSavingsCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/installment-savings",
  title: "적금 이자 계산기 — 총 납입액·예상 이자·만기 수령액",
  description:
    "월 납입액·금리·기간을 입력하면 총 납입 원금, 세전·세후 예상 이자와 만기 수령액을 계산합니다. 적금 이자가 왜 생각보다 적은지 정액적립식 기준으로 알려드립니다.",
  keywords: ["적금이자계산기", "적금계산기", "적금만기", "정액적립식", "적금이자"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "적금 이자 계산기", url: `${BASE_URL}/finance/installment-savings` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "월 50만 원 · 1년 적금",
    desc: "월 50만원, 연 4.0%, 12개월, 일반과세",
    inputs: [
      { label: "월 납입액", value: "50만원" },
      { label: "금리", value: "연 4.0%" },
      { label: "기간", value: "12개월" },
      { label: "과세", value: "일반과세" },
    ],
    results: [
      { label: "총 납입 원금", value: "600만" },
      { label: "세전 예상 이자", value: "130,000원", highlight: true },
      { label: "세후 예상 이자", value: "109,980원" },
      { label: "만기 수령액", value: "611만" },
    ],
    note: "‘600만 × 4% = 24만’이 아닙니다. 첫 달 납입금만 12개월치 이자를 받고 마지막 달 납입금은 1개월치만 받기 때문에, 실제 세전 이자는 약 13만 원입니다.",
  },
  {
    title: "월 30만 원 · 2년 적금",
    desc: "월 30만원, 연 3.5%, 24개월, 일반과세",
    inputs: [
      { label: "월 납입액", value: "30만원" },
      { label: "금리", value: "연 3.5%" },
      { label: "기간", value: "24개월" },
      { label: "과세", value: "일반과세" },
    ],
    results: [
      { label: "총 납입 원금", value: "720만" },
      { label: "세전 예상 이자", value: "262,500원", highlight: true },
      { label: "세후 예상 이자", value: "222,075원" },
      { label: "만기 수령액", value: "742만" },
    ],
    note: "기간이 길수록 앞쪽 납입금이 이자를 받는 개월 수가 늘어 총 이자도 커집니다. 표준 정액적립식 기준 예상치입니다.",
  },
];

const FAQ = [
  {
    q: "표시 금리가 같으면 예금과 적금 이자도 같나요?",
    a: "아닙니다. 예금은 목돈 전체가 예치 기간 내내 이자를 받지만, 적금은 매달 나눠 넣기 때문에 납입 회차마다 예치 기간이 다릅니다. 그래서 같은 표시 금리라도 적금의 총 이자는 예금보다 작게 느껴질 수 있습니다.",
  },
  {
    q: "적금 이자는 왜 생각보다 적나요?",
    a: "첫 달에 넣은 돈은 만기까지 오래 예치되어 이자를 많이 받지만, 마지막 달에 넣은 돈은 한 달치 이자만 받습니다. 정액적립식 표준 계산에서는 이자가 '월 납입액 × 월이율 × n(n+1)/2'로 계산되어, 총 납입액에 금리를 단순히 곱한 값의 절반가량이 됩니다.",
  },
  {
    q: "이 계산기의 결과는 실제 은행과 정확히 같나요?",
    a: "월 단위 표준 정액적립식 기준 예상치입니다. 실제 금융기관은 납입일·만기일·일수 계산과 선납·지연납입·중도해지 여부에 따라 지급액이 달라질 수 있으므로, 정확한 금액은 가입 상품의 약관으로 확인하세요.",
  },
  {
    q: "일반과세와 비과세는 어떻게 다른가요?",
    a: "일반과세는 이자에서 이자소득세 15.4%가 원천징수됩니다. 비과세는 비과세종합저축 등 법령이 정한 자격·상품 조건을 충족한 경우에만 적용되며, 누구나 임의로 선택하는 옵션이 아닙니다.",
  },
  {
    q: "예금과 적금 중 무엇이 유리한가요?",
    a: "이미 목돈이 있다면 예금, 매달 일정 금액을 모으는 중이라면 적금이 맞습니다. 목돈을 예금에 넣는 편이 같은 금리라도 총 이자는 더 큽니다. 상황에 따라 예금 계산기와 함께 비교해 보세요.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="적금 이자 계산기"
        description="월 납입액·금리·기간을 입력하면 총 납입 원금, 세전·세후 예상 이자와 만기 수령액을 바로 확인할 수 있습니다."
        icon="🪙"
        slug="finance/installment-savings"
        breadcrumb={crumbs}
        calculator={<InstallmentSavingsCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">
              적금 이자 계산기란?
            </h2>
            <p>
              적금 이자 계산기는 매달 일정 금액을 납입하는 정액적립식 적금의 만기
              이자와 수령액을 미리 계산하는 도구입니다. 월 납입액, 연 금리, 납입
              기간을 입력하면 총 납입 원금, 세전·세후 예상 이자, 만기 수령액을
              보여 줍니다. 목돈을 한 번에 넣는{" "}
              <Link
                href="/finance/deposit"
                className="font-semibold text-brand-600 underline underline-offset-2"
              >
                예금
              </Link>
              과 달리, 적금은 매달 돈을 나눠 넣기 때문에 이자 계산 방식이 다릅니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              적금 이자가 생각보다 적은 이유
            </h2>
            <p>
              흔히 월 50만 원씩 12개월을 연 4%로 넣으면 ‘총 600만 원 × 4% = 24만
              원’의 이자를 기대합니다. 하지만 실제 세전 이자는 약 13만 원입니다.
              첫 달에 넣은 50만 원은 12개월 내내 이자를 받지만, 마지막 달에 넣은
              50만 원은 한 달치 이자만 받기 때문입니다. 모든 납입금이 처음부터 1년
              내내 예치되는 것이 아니라는 점이 핵심입니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">적금 이자 계산 공식</h2>
            <div className="rounded bg-slate-100 p-4">
              <strong>세전 이자 = 월 납입액 × (연이율 ÷ 12) × n(n+1) ÷ 2</strong>
              <br />
              (n = 납입 개월 수)
            </div>
            <p>
              이 공식은 각 회차 납입금의 예치 기간을 첫 회 n개월부터 마지막 회
              1개월까지 합산한 것입니다. 여기에 일반과세라면 이자소득세 15.4%를
              적용해 세후 이자를 구합니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              계산 결과는 ‘표준 정액적립식 예상치’
            </h2>
            <p>
              이 계산기는 월 단위 표준 정액적립식을 기준으로 한 예상치입니다. 실제
              금융기관은 납입일과 만기일 사이의 실제 경과 일수, 선납·지연납입,
              중도해지 여부에 따라 이자를 다르게 산정합니다. 따라서 결과는 대략적인
              규모를 가늠하는 용도로 보고, 정확한 만기 금액은 가입 상품의 약관과
              금융기관 안내로 확인하는 것이 좋습니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">계산 시 주의사항</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                결과는 표준 정액적립식 예상치이며, 실제 지급액은 납입일·일수 처리에
                따라 달라질 수 있습니다.
              </li>
              <li>
                표시 금리가 기본금리인지, 자동이체·급여이체 등 우대 조건을 채워야
                받는 우대금리 포함인지 확인하세요.
              </li>
              <li>
                세금은 일반 세율을 적용한 예상치입니다. 비과세는 자격·상품 조건이
                필요합니다.
              </li>
              <li>
                매달 납입 한도가 있는 상품인지, 자동이체 날짜에 따라 이자가 달라질 수
                있는지도 함께 확인하세요.
              </li>
            </ul>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">예금·적금·복리 함께 보기</p>
              <p className="mt-2">
                이미 목돈이 있다면 예금, 매달 저축하는 중이라면 적금, 이자를 다시
                굴리는 장기 효과가 궁금하다면 복리 계산기를 함께 이용하면 내 상황에
                맞는 저축 방식을 고르기 쉽습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
          { label: "복리 계산기", href: "/finance/compound", icon: "📈" },
          { label: "대출이자 계산기", href: "/loan-interest-calculator", icon: "💸" },
        ]}
      />
    </Suspense>
  );
}
