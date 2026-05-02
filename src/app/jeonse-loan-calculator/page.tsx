// src/app/jeonse-loan-calculator/page.tsx
<section className="mt-10 space-y-6 text-sm leading-relaxed text-gray-700">
  <h2 className="text-xl font-bold text-gray-900">전세대출 계산기란?</h2>
  <p>
    전세대출 계산기는 전세보증금, 대출 비율, 금리를 기준으로 예상 대출금과 월 이자 부담을 계산하는 도구입니다.
    전세 계약을 준비할 때 필요한 자기자본 규모와 매월 부담해야 할 이자를 미리 확인하는 데 도움이 됩니다.
  </p>

  <h2 className="text-xl font-bold text-gray-900">전세대출 계산 공식</h2>
  <div className="rounded bg-gray-100 p-4">
    <strong>대출금액 = 전세보증금 × 대출비율</strong>
    <br />
    <strong>월 이자 = 대출금액 × 연 금리 ÷ 12</strong>
  </div>

  <h2 className="text-xl font-bold text-gray-900">실제 계산 예시</h2>
  <p>
    전세보증금 3억 원, 대출비율 80%, 연 금리 4% 조건이라면 예상 대출금은 2억 4천만 원입니다.
    이 경우 월 이자는 약 80만 원입니다.
  </p>

  <div className="overflow-x-auto">
    <table className="w-full border text-center">
      <thead className="bg-gray-100">
      <tr>
        <th className="border p-2">전세보증금</th>
        <th className="border p-2">대출비율</th>
        <th className="border p-2">예상 대출금</th>
        <th className="border p-2">연 4% 월 이자</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td className="border p-2">2억 원</td>
        <td className="border p-2">80%</td>
        <td className="border p-2">1억 6천만 원</td>
        <td className="border p-2">약 53만 원</td>
      </tr>
      <tr>
        <td className="border p-2">3억 원</td>
        <td className="border p-2">80%</td>
        <td className="border p-2">2억 4천만 원</td>
        <td className="border p-2">약 80만 원</td>
      </tr>
      <tr>
        <td className="border p-2">4억 원</td>
        <td className="border p-2">80%</td>
        <td className="border p-2">3억 2천만 원</td>
        <td className="border p-2">약 107만 원</td>
      </tr>
      </tbody>
    </table>
  </div>

  <h2 className="text-xl font-bold text-gray-900">전세대출 이용 시 주의사항</h2>
  <ul className="list-disc space-y-1 pl-5">
    <li>실제 대출 한도는 소득, 신용점수, 보증기관 심사 결과에 따라 달라질 수 있습니다.</li>
    <li>변동금리 상품은 금리 상승 시 월 이자 부담이 커질 수 있습니다.</li>
    <li>보증료, 인지세, 중도상환수수료 등 부대비용은 별도로 확인해야 합니다.</li>
    <li>전세보증보험 가입 가능 여부와 임대차 계약 조건도 함께 확인하는 것이 좋습니다.</li>
  </ul>

  <h2 className="text-xl font-bold text-gray-900">전세대출과 월세 비교</h2>
  <p>
    전세대출을 이용할 때는 월 이자와 월세를 함께 비교해야 합니다.
    예를 들어 전세대출 월 이자가 80만 원이고 비슷한 주택의 월세가 100만 원이라면 전세가 유리할 수 있습니다.
    반대로 금리가 올라 전세대출 이자가 월세와 비슷해지면 월세 선택이 더 합리적일 수도 있습니다.
  </p>

  <h2 className="text-xl font-bold text-gray-900">자주 묻는 질문 (FAQ)</h2>

  <h3 className="font-semibold text-gray-900">Q. 전세대출은 보증금의 몇 %까지 가능한가요?</h3>
  <p>
    일반적으로 보증금의 70~80% 수준까지 가능한 경우가 많지만, 상품과 개인 조건에 따라 달라집니다.
  </p>

  <h3 className="font-semibold text-gray-900">Q. 전세대출은 원금을 매달 갚나요?</h3>
  <p>
    전세대출은 만기일시상환 방식이 많아 대출 기간 중에는 이자만 내고 만기에 원금을 상환하는 경우가 많습니다.
  </p>

  <h3 className="font-semibold text-gray-900">Q. 전세대출 이자와 월세는 어떻게 비교하나요?</h3>
  <p>
    전세대출 월 이자가 월세보다 낮다면 전세가 유리할 수 있습니다. 다만 보증금 마련 비용과 보증료도 함께 비교해야 합니다.
  </p>

  <div className="rounded bg-blue-50 p-4 text-blue-900">
    👉 위 계산기에 전세보증금과 금리를 입력해 월 이자 부담을 먼저 확인해보세요.
  </div>
</section>