import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/metadata";
import { blogPosts } from "@/data/blogPosts";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return buildMetadata({
      slug: `blog/${slug}`,
      title: "금융 가이드",
      description: "머니계산기 금융 가이드",
    });
  }

  return buildMetadata({
    slug: `blog/${slug}`,
    title: post.title,
    description: post.description,
  });
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
      >
        ← 가이드 목록으로
      </Link>

      <article className="rounded-2xl border border-slate-100 bg-white p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600">
            {post.category}
          </span>
          <span className="text-xs text-slate-400">{post.date}</span>
        </div>

        <h1 className="mb-4 text-3xl font-black leading-tight text-slate-900">
          {post.title}
        </h1>

        <p className="mb-8 text-base leading-relaxed text-slate-500">
          {post.description}
        </p>

        <div className="space-y-5 text-[17px] leading-8 text-slate-700">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
