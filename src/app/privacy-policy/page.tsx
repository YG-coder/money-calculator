// src/app/privacy-policy/page.tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  slug: "privacy-policy",
  title: "개인정보처리방침",
  description: "머니계산기 개인정보처리방침을 안내합니다.",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-1 text-3xl font-black text-slate-900">
        개인정보처리방침
      </h1>
      <p className="mb-8 text-sm text-slate-400">
        최종 수정일: 2026년 4월 15일
      </p>

      <div className="space-y-7 rounded-2xl border border-slate-100 bg-white p-8 text-sm leading-relaxed text-slate-600 shadow-sm">
        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            1. 개인정보 수집 여부
          </h2>
          <p>
            머니계산기(머니계산기.kr)는 계산기 이용 과정에서 사용자의 개인정보를
            직접 수집하지 않습니다. 사용자가 입력하는 대출 원금, 금리, 기간 등의
            수치는 서버에 저장되지 않으며 브라우저 내에서만 처리됩니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            2. 입력 데이터 처리 방식
          </h2>
          <p>
            본 사이트의 계산 기능은 사용자의 브라우저에서 동작하도록 설계되어
            있습니다. 따라서 입력된 계산 값은 별도의 회원 데이터나 서버
            데이터베이스에 저장되지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            3. 쿠키 및 로그 정보
          </h2>
          <p>
            본 사이트는 서비스 품질 개선 및 방문 통계 분석을 위해 쿠키 또는
            익명화된 로그 정보를 사용할 수 있습니다. 이 정보에는 방문 페이지,
            브라우저 종류, 접속 시간, 체류 시간 등이 포함될 수 있으나, 개인을
            직접 식별하는 정보는 포함하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            4. 광고 서비스 이용
          </h2>
          <p>
            본 사이트는 Google AdSense와 같은 제3자 광고 서비스를 사용할 수
            있으며, 광고 제공 과정에서 쿠키가 사용될 수 있습니다. 이를 통해
            사용자의 관심사에 기반한 광고가 표시될 수 있습니다. 사용자는
            브라우저 설정을 통해 쿠키 저장을 제한하거나 삭제할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            5. 제3자 제공
          </h2>
          <p>
            본 사이트는 이용자의 개인정보를 직접 수집하지 않으며, 법령에 따른
            경우를 제외하고 어떠한 정보도 제3자에게 판매하거나 제공하지
            않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            6. 외부 링크
          </h2>
          <p>
            본 사이트는 참고용 정보 제공을 위해 외부 사이트로 연결되는 링크를
            포함할 수 있습니다. 외부 사이트의 개인정보처리방침 및 운영 방식은 본
            사이트와 무관하며, 해당 사이트의 정책을 별도로 확인하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">
            7. 이용자의 권리
          </h2>
          <p>
            사용자는 언제든지 브라우저 설정을 통해 쿠키 저장을 차단하거나 기존
            쿠키를 삭제할 수 있습니다. 다만 일부 기능은 정상적으로 동작하지 않을
            수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-bold text-slate-800">8. 문의</h2>
          <p>
            개인정보 처리와 관련한 문의는 아래 이메일로 접수하실 수 있습니다.
          </p>
          <p className="mt-2">
            이메일:{" "}
            <a
              href="mailto:support@머니계산기.kr"
              className="font-semibold text-brand-600 underline-offset-2 hover:underline"
            >
              support@머니계산기.kr
            </a>
          </p>
        </section>

        <p className="border-t border-slate-100 pt-2 text-xs text-slate-400">
          본 개인정보처리방침은 관련 법령 및 서비스 운영 정책 변경에 따라 수정될
          수 있으며, 변경 사항은 본 페이지를 통해 공지됩니다.
        </p>
      </div>
    </div>
  );
}
