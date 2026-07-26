// src/app/finance/goal-savings/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { buildMetadata, BASE_URL } from "@/lib/metadata";
import CalcShell, { type CalcExample } from "@/components/calculator/CalcShell";
import GoalSavingsCalc from "@/components/calculator/GoalSavingsCalc";

export const metadata: Metadata = buildMetadata({
  slug: "finance/goal-savings",
  title: "목표 저축 계산기 — 월 납입액·기간·목표금액 역산",
  description:
    "목표 금액을 정하면 매달 얼마씩 저축해야 하는지, 매달 넣는 금액으로 목표까지 얼마나 걸리는지, 일정 기간 뒤 얼마를 모을 수 있는지 계산합니다. 월복리 세전 기준.",
  keywords: ["목표저축계산기", "저축계산기", "월저축액계산", "목표금액", "적립계산기"],
});

const crumbs = [
  { name: "홈", url: BASE_URL },
  { name: "금융 계산기", url: `${BASE_URL}/finance` },
  { name: "목표 저축 계산기", url: `${BASE_URL}/finance/goal-savings` },
];

const EXAMPLES: CalcExample[] = [
  {
    title: "3년 안에 1,000만 원 모으기",
    desc: "목표 1,000만원, 연 3%, 36개월 → 필요한 월 납입액",
    inputs: [
      { label: "모드", value: "월 납입액 구하기" },
      { label: "목표 금액", value: "1,000만원" },
      { label: "기간", value: "36개월" },
      { label: "연이율", value: "3%" },
    ],
    results: [
      { label: "필요한 월 납입액", value: "265,812원", highlight: true },
      { label: "총 납입 원금", value: "957만" },
      { label: "세전 이자", value: "430,765원" },
    ],
    note: "매달 약 26.6만 원씩 넣으면 이자 덕분에 총 957만 원만 납입해도 1,000만 원에 도달합니다.",
  },
  {
    title: "매달 30만 원, 5년 뒤엔?",
    desc: "월 30만원, 60개월, 연 3% → 예상 도달 금액",
    inputs: [
      { label: "모드", value: "도달 금액 구하기" },
      { label: "월 납입액", value: "30만원" },
      { label: "기간", value: "60개월" },
      { label: "연이율", value: "3%" },
    ],
    results: [
      { label: "예상 도달 금액", value: "1,939만", highlight: true },
      { label: "총 납입 원금", value: "1,800만" },
      { label: "세전 이자", value: "1,394,014원" },
    ],
    note: "총 1,800만 원을 넣어 세전 약 1,939만 원. 월복리로 이자가 붙어 약 139만 원이 더 쌓입니다.",
  },
];

const FAQ = [
  {
    q: "목표 저축 계산기는 어떤 계산기인가요?",
    a: "특정 예·적금 상품의 세후 수령액을 맞추는 도구가 아니라, 목표 금액을 세우고 저축 계획을 짜는 계산기입니다. ‘목표금액→월 납입액’, ‘월 납입액→기간’, ‘월 납입액+기간→도달액’ 세 가지 모드로 원하는 값을 역산할 수 있습니다.",
  },
  {
    q: "왜 세전 기준인가요?",
    a: "이자소득세는 비과세·세금우대·상품별 과세 방식에 따라 달라져, 세금을 일괄 반영하면 오히려 부정확해집니다. 목표 저축은 ‘얼마를 어떻게 모을지’ 계획이 핵심이므로 세전 기준으로 단순하게 계산하고, 실제 세후 수령액은 예금·적금 계산기에서 상품 조건에 맞춰 확인하는 것이 정확합니다.",
  },
  {
    q: "계산은 어떤 방식으로 하나요?",
    a: "매월 말에 일정 금액을 납입하고 월복리로 불어난다고 가정합니다. 중도 인출이 없고 수수료·세금은 반영하지 않는 이상적인 적립 모델이라, 실제 금액과는 차이가 날 수 있습니다.",
  },
  {
    q: "이자율을 모르면 어떻게 하나요?",
    a: "보수적으로 잡고 싶다면 연이율에 0을 넣어 이자 없이 순수 납입만으로 계획을 세울 수 있습니다. 이 경우 목표 금액 ÷ 월 납입액이 곧 필요한 개월 수가 됩니다.",
  },
  {
    q: "결과가 실제 저축액과 정확히 같나요?",
    a: "아니요, 참고용 예상치입니다. 실제로는 금리 변동, 세금, 우대금리 조건, 납입일 처리 등에 따라 달라집니다. 큰 그림의 저축 계획을 잡는 용도로 활용하세요.",
  },
];

export default function Page() {
  return (
    <Suspense>
      <CalcShell
        title="목표 저축 계산기"
        description="목표 금액·월 납입액·기간 중 두 가지를 정하면 나머지 하나를 계산해 저축 계획을 세워줍니다."
        icon="🎯"
        slug="finance/goal-savings"
        breadcrumb={crumbs}
        calculator={<GoalSavingsCalc />}
        guide={
          <>
            <h2 className="text-xl font-bold text-slate-900">목표 저축 계산기란?</h2>
            <p>
              목표 저축 계산기는 ‘언제까지 얼마를 모으고 싶다’는 목표를 세우고, 그에
              맞는 저축 계획을 역산하는 도구입니다. 목표 금액·월 납입액·기간 중 두
              가지를 입력하면 나머지 하나를 계산합니다. 특정 상품의 세후 수령액을
              맞추는 것이 목적인{" "}
              <Link
                href="/finance/deposit"
                className="font-semibold text-brand-600 underline underline-offset-2"
              >
                예금
              </Link>
              ·
              <Link
                href="/finance/installment-savings"
                className="font-semibold text-brand-600 underline underline-offset-2"
              >
                적금
              </Link>{" "}
              계산기와 달리, 이 계산기는 ‘계획 세우기’에 초점을 둡니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">세 가지 모드</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>월 납입액 구하기</strong> — 목표 금액과 기간을 정하면 매달
                얼마씩 넣어야 하는지 계산합니다. “3년 안에 1,000만 원”처럼 목표가
                뚜렷할 때 유용합니다.
              </li>
              <li>
                <strong>필요 기간 구하기</strong> — 매달 넣을 금액과 목표 금액을
                정하면 목표까지 얼마나 걸리는지 계산합니다.
              </li>
              <li>
                <strong>도달 금액 구하기</strong> — 매달 넣을 금액과 기간을 정하면
                그 기간 뒤 얼마를 모을 수 있는지 계산합니다.
              </li>
            </ul>

            <h2 className="text-xl font-bold text-slate-900">계산 기준</h2>
            <div className="rounded bg-slate-100 p-4">
              매월 말 일정 금액 납입 · <strong>월복리</strong> · 세전 기준 · 중도 인출
              없음 · 세금·수수료 미반영
            </div>
            <p>
              예를 들어 목표 1,000만 원, 연 3%, 36개월이면 매달 약 26.6만 원을 넣으면
              됩니다. 이자 덕분에 총 납입 원금은 957만 원 정도로 목표보다 적습니다.
              반대로 매달 30만 원씩 5년(60개월)을 연 3%로 넣으면 세전 약 1,939만 원이
              됩니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">
              왜 세전 기준으로 계산할까
            </h2>
            <p>
              이자소득세(일반과세 15.4%)는 비과세종합저축·세금우대 등 상품과 자격에
              따라 달라집니다. 목표 저축 계산기는 특정 상품이 아니라 ‘저축 계획’을
              세우는 도구라, 세금을 일괄로 반영하면 오히려 부정확해집니다. 그래서
              세전으로 단순하게 계획을 잡고, 실제 세후 수령액이 필요하면 예금·적금
              계산기에서 상품 조건에 맞춰 확인하는 것을 권장합니다.
            </p>

            <h2 className="text-xl font-bold text-slate-900">계산 시 주의사항</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                세전·이상적 적립 모델 기준입니다. 실제 세후 수령액은 상품의 과세 방식과
                조건에 따라 달라집니다.
              </li>
              <li>
                가정한 연이율이 기간 내내 유지된다는 전제입니다. 시장 금리 변동은
                반영하지 않습니다.
              </li>
              <li>중도 인출·수수료·우대금리 조건은 반영하지 않습니다.</li>
              <li>이자율을 모르면 0을 입력해 순수 납입 기준으로 계획할 수 있습니다.</li>
            </ul>

            <div className="rounded-2xl bg-blue-50 p-5 text-blue-900">
              <p className="font-bold">저축 계산기 함께 보기</p>
              <p className="mt-2">
                목표 계획은 목표 저축 계산기로, 특정 상품의 세후 이자는 예금·적금
                계산기로, 장기 복리 효과는 복리 계산기로 나눠서 보면 저축 전략을 더
                입체적으로 세울 수 있습니다.
              </p>
            </div>
          </>
        }
        examples={EXAMPLES}
        faq={FAQ}
        relatedCalcs={[
          { label: "예금 이자 계산기", href: "/finance/deposit", icon: "🏦" },
          { label: "적금 이자 계산기", href: "/finance/installment-savings", icon: "🪙" },
          { label: "복리 계산기", href: "/finance/compound", icon: "📈" },
        ]}
      />
    </Suspense>
  );
}
