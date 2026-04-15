/**
 * types/calculator.ts
 * 계산기 관련 공유 타입 정의
 */

/** useCalcState 훅의 필드 정의 */
export interface FieldDef {
  key: string;
  defaultValue: string;
  validate?: (v: string) => string | undefined;
}

/** 계산기 네비게이션 아이템 */
export interface CalcNavItem {
  title: string;
  href: string;
  icon: string;
  desc: string;
}

/** 가이드/블로그 포스트 프리뷰 */
export interface GuidePost {
  category: string;
  title: string;
  desc: string;
  href: string;
  date: string;
}

/** FAQ 항목 */
export interface FaqItem {
  q: string;
  a: string;
}
