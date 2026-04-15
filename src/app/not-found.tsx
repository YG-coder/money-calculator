import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-2xl font-black text-slate-900 mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-slate-500 mb-8 text-sm">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/"
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold
                     px-6 py-3 rounded-xl transition-colors">
          홈으로 돌아가기
        </Link>
        <Link href="/loan-interest-calculator"
          className="bg-white hover:bg-slate-50 text-slate-700 font-bold
                     px-6 py-3 rounded-xl border border-slate-200 transition-colors">
          대출이자 계산기
        </Link>
      </div>
    </div>
  );
}
