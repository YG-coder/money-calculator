// src/app/jeonse-loan-calculator/page.tsx
<section className="mt-10 space-y-6 text-sm leading-relaxed text-gray-700">

  <h2 className="text-xl font-bold text-gray-900">대출이자란 무엇인가요?</h2>
  <p>
    대출이자는 금융기관으로부터 돈을 빌린 대가로 지급하는 비용입니다. 단순히 금리만 보고 판단하기보다는 대출 기간, 상환 방식에 따라 실제 부담하는 총이자가 크게 달라질 수 있습니다.
    특히 동일한 금리라도 상환 방식에 따라 총 이자 차이가 수백만 원에서 수천만 원까지 발생할 수 있기 때문에 정확한 계산이 중요합니다.
  </p>

  <h2 className="text-xl font-bold text-gray-900">대출이자 계산 공식</h2>
  <p>
    기본적인 이자 계산 공식은 다음과 같습니다.
  </p>
  <div className="bg-gray-100 p-4 rounded">
    <strong>이자 = 대출금액 × 금리 × 기간</strong>
  </div>
  <p>
    하지만 실제 대출에서는 단순 이자 계산이 아닌 상환 방식에 따라 매달 상환금과 이자가 달라집니다.
  </p>

  <h2 className="text-xl font-bold text-gray-900">상환 방식별 차이</h2>
  <table className="w-full border text-center">
    <thead className="bg-gray-100">
    <tr>
      <th className="border p-2">상환 방식</th>
      <th className="border p-2">특징</th>
      <th className="border p-2">총 이자</th>
    </tr>
    </thead>
    <tbody>
    <tr>
      <td className="border p-2">원리금균등</td>
      <td className="border p-2">매달 동일한 금액 상환</td>
      <td className="border p-2">높음</td>
    </tr>
    <tr>
      <td className="border p-2">원금균등</td>
      <td className="border p-2">초기 상환 부담 큼</td>
      <td className="border p-2">낮음</td>
    </tr>
    </tbody>
  </table>

  <h2 className="text-xl font-bold text-gray-900">실제 계산 예시</h2>
  <p>
    예를 들어 1억 원을 연 4% 금리로 20년 동안 대출받는 경우를 살펴보겠습니다.
  </p>
  <ul className="list-disc pl-5 space-y-1">
    <li>원리금균등: 총 이자 약 4,800만 원</li>
    <li>원금균등: 총 이자 약 4,000만 원</li>
  </ul>
  <p>
    같은 조건에서도 약 800만 원 이상의 차이가 발생합니다.
  </p>

  <h2 className="text-xl font-bold text-gray-900">주의사항</h2>
  <ul className="list-disc pl-5 space-y-1">
    <li>금리는 변동될 수 있으며 실제 금융기관 조건과 다를 수 있습니다.</li>
    <li>중도상환수수료, 각종 부대비용은 포함되지 않을 수 있습니다.</li>
    <li>계산 결과는 참고용이며 실제 대출 조건은 금융기관을 통해 확인해야 합니다.</li>
  </ul>

  <h2 className="text-xl font-bold text-gray-900">자주 묻는 질문 (FAQ)</h2>

  <h3 className="font-semibold text-gray-900">Q. 금리가 낮으면 무조건 좋은가요?</h3>
  <p>금리가 낮아도 상환 방식이나 기간에 따라 총 이자가 더 많을 수 있습니다.</p>

  <h3 className="font-semibold text-gray-900">Q. 원리금균등과 원금균등 중 어떤 것이 유리한가요?</h3>
  <p>장기적으로는 원금균등이 총 이자가 적지만 초기 부담이 큽니다.</p>

  <h3 className="font-semibold text-gray-900">Q. 대출 기간은 짧을수록 좋은가요?</h3>
  <p>기간이 짧을수록 총 이자는 줄어들지만 월 상환금은 증가합니다.</p>

  <div className="bg-blue-50 p-4 rounded text-blue-900">
    👉 위 계산기를 통해 직접 대출 조건을 입력하고 나에게 가장 유리한 상환 방식을 확인해보세요.
  </div>

</section>