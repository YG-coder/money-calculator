import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { blogPosts } from "@/data/blogPosts";

export const metadata: Metadata = buildMetadata({
  slug: "blog",
  title: "금융 가이드 — 대출·이자·전세 완전 정복",
  description: "대출이자 절약법, 원리금 상환 방식 비교, 전세대출 완벽 가이드.",
});

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 mb-2">금융 가이드</h1>
        <p className="text-slate-500">
          대출, 이자, 전세 관련 실용 금융 정보를 제공합니다.
        </p>
      </div>

      {/* 포스트 목록 */}
      <div className="space-y-4">
        {blogPosts
          .filter((post) => post.published !== false)
          .map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group block bg-white rounded-2xl border border-slate-100 shadow-sm
                       p-6 hover:border-brand-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-slate-400">{post.date}</span>
            </div>

            <h2
              className="font-black text-slate-900 mb-1.5 text-lg leading-snug
                         group-hover:text-brand-600 transition-colors"
            >
              {post.title}
            </h2>

            <p className="text-sm text-slate-500 leading-relaxed">
              {post.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
