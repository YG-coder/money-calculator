import Link from "next/link";

const CALC_LINKS = [
  { label: "대출이자 계산기", href: "/loan-interest-calculator" },
  { label: "원리금상환 계산기", href: "/amortization-calculator" },
  { label: "전세대출 계산기", href: "/jeonse-loan-calculator" },
  { label: "중도상환 계산기", href: "/prepayment-calculator" },
];

const INFO_LINKS = [
  { label: "소개", href: "/about" },
  { label: "금융 가이드", href: "/blog" },
  { label: "개인정보처리방침", href: "/privacy-policy" },
  { label: "이용약관", href: "/terms" },
  { label: "문의하기", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-white font-black text-lg flex items-center gap-2 mb-3"
            >
              <span>💰</span>
              머니<span className="text-brand-400">계산기</span>
            </Link>
            <p className="text-sm leading-relaxed">
              복잡한 금융 계산을 쉽고 빠르게.
              <br />
              입력값은 서버에 전송되지 않습니다.
            </p>
          </div>

          {/* Calculators */}
          <div>
            <h3 className="text-slate-200 font-bold mb-3 text-xs uppercase tracking-widest">
              계산기
            </h3>
            <ul className="space-y-2">
              {CALC_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-slate-200 font-bold mb-3 text-xs uppercase tracking-widest">
              안내
            </h3>
            <ul className="space-y-2">
              {INFO_LINKS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <p>
            © {new Date().getFullYear()} 머니계산기 (머니계산기.kr). All rights
            reserved.
          </p>
          <p className="text-slate-500 text-center">
            본 계산 결과는 참고용이며 실제 금융 상품과 차이가 있을 수 있습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
