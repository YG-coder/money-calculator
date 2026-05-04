// src/components/blog/BlogContent.tsx
//
// 블로그 본문 렌더러.
// Block[] 또는 string[] 형식의 content를 받아서 풍부한 마크업으로 렌더링합니다.

import Link from "next/link";
import type { Block } from "@/data/blogPosts";
import { normalizeContent } from "@/data/blogPosts";

// ─────────────────────────────────────────────────────────────
// 인라인 마크업 처리
// ─────────────────────────────────────────────────────────────

/**
 * 인라인 토큰을 React 노드로 변환합니다.
 * HTML 인젝션 방지를 위해 평문은 그대로 둔 채 마크업만 변환합니다.
 *
 * 지원 문법:
 *   **text**           →  <strong>text</strong>
 *   _text_             →  <em>text</em>
 *   [text](/내부경로)  →  Next.js <Link>
 *   [text](https://…)  →  외부 <a target="_blank" rel="noopener noreferrer">
 *
 * 우선순위: 링크 > 굵게 > 기울임 (링크 텍스트가 우선 매칭됨)
 */
function renderInline(input: string): React.ReactNode {
  if (!input) return null;

  // 세 가지 패턴을 한 정규식으로 처리 (왼쪽 → 오른쪽 우선순위로 매칭)
  // 그룹 1,2: 링크 텍스트, URL
  // 그룹 3: 굵게 내용
  // 그룹 4: 기울임 내용
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|_([^_]+)_/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(input.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      // 링크
      const text = match[1];
      const url = match[2];
      const isExternal = /^https?:\/\//.test(url);

      if (isExternal) {
        nodes.push(
          <a
            key={key++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            {text}
          </a>
        );
      } else {
        nodes.push(
          <Link
            key={key++}
            href={url}
            className="text-brand-600 underline underline-offset-2 hover:text-brand-700"
          >
            {text}
          </Link>
        );
      }
    } else if (match[3] !== undefined) {
      nodes.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key++}>{match[4]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < input.length) {
    nodes.push(input.slice(lastIndex));
  }

  return nodes.length === 1 ? nodes[0] : <>{nodes}</>;
}

// ─────────────────────────────────────────────────────────────
// 콜아웃 박스 스타일
// ─────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info: {
    box: "border-blue-200 bg-blue-50",
    title: "text-blue-900",
    body: "text-blue-900",
    icon: "💡",
  },
  warn: {
    box: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    body: "text-amber-900",
    icon: "⚠️",
  },
  tip: {
    box: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-900",
    body: "text-emerald-900",
    icon: "✅",
  },
  summary: {
    box: "border-slate-200 bg-slate-50",
    title: "text-slate-900",
    body: "text-slate-700",
    icon: "📌",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// 개별 블록 렌더링
// ─────────────────────────────────────────────────────────────

function renderBlock(block: Block, index: number): React.ReactNode {
  switch (block.type) {
    case "h2":
      return (
        <h2
          key={index}
          className="mt-10 mb-4 text-2xl font-black text-slate-900"
        >
          {block.text}
        </h2>
      );

    case "h3":
      return (
        <h3
          key={index}
          className="mt-7 mb-3 text-lg font-bold text-slate-900"
        >
          {block.text}
        </h3>
      );

    case "p":
      return (
        <p key={index} className="leading-8 text-slate-700">
          {renderInline(block.text)}
        </p>
      );

    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      const listClass = block.ordered
        ? "list-decimal space-y-2 pl-6 text-slate-700"
        : "list-disc space-y-2 pl-6 text-slate-700";
      return (
        <ListTag key={index} className={listClass}>
          {block.items.map((item, i) => (
            <li key={i} className="leading-7">
              {renderInline(item)}
            </li>
          ))}
        </ListTag>
      );
    }

    case "table":
      return (
        <div key={index} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50">
                {block.headers.map((header, i) => (
                  <th
                    key={i}
                    className="border border-slate-200 p-3 text-left font-bold text-slate-800"
                  >
                    {renderInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="border border-slate-200 p-3 text-slate-700"
                    >
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <p className="mt-2 text-xs text-slate-500">{block.caption}</p>
          )}
        </div>
      );

    case "callout": {
      const variant = block.variant ?? "info";
      const styles = CALLOUT_STYLES[variant];
      return (
        <div
          key={index}
          className={`rounded-2xl border ${styles.box} p-5`}
        >
          {block.title && (
            <p className={`mb-2 font-bold ${styles.title}`}>
              {styles.icon} {block.title}
            </p>
          )}
          <p className={`leading-7 ${styles.body}`}>
            {renderInline(block.text)}
          </p>
        </div>
      );
    }

    default: {
      // 알 수 없는 블록 타입이 들어와도 빌드는 깨지지 않도록 무시합니다.
      const _exhaustive: never = block;
      return null;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────

export default function BlogContent({
  content,
}: {
  content: Block[] | string[];
}) {
  const blocks = normalizeContent(content);

  return (
    <div className="space-y-5 text-[17px]">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
