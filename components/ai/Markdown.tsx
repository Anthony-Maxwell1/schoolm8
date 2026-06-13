"use client";

/**
 * components/ai/Markdown.tsx
 *
 * Markdown renderer for AI replies: GitHub-flavoured markdown, LaTeX maths
 * (inline $…$ and block $$…$$), and syntax-highlighted code. Styling is mapped
 * to the app's CSS-variable theme so it looks native in light and dark mode.
 */

import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

export const Markdown = memo(function Markdown({
    children,
    className,
}: {
    children: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "text-[15px] leading-relaxed text-[var(--color-text-primary)] [overflow-wrap:anywhere]",
                className,
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
                components={{
                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                    h1: ({ children }) => (
                        <h1 className="mb-3 mt-5 text-xl font-semibold first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mb-2 mt-5 text-lg font-semibold first:mt-0">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                    ),
                    li: ({ children }) => <li className="pl-0.5">{children}</li>,
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-primary)] underline underline-offset-2 hover:text-[var(--color-primary-hover)]"
                        >
                            {children}
                        </a>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-semibold text-[var(--color-text-primary)]">
                            {children}
                        </strong>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="mb-3 border-l-2 border-[var(--color-border-strong)] pl-3 text-[var(--color-text-secondary)] italic">
                            {children}
                        </blockquote>
                    ),
                    code: ({ className: codeClass, children, ...props }) => {
                        const isBlock = /language-/.test(codeClass ?? "");
                        if (isBlock) {
                            return (
                                <code className={cn(codeClass, "hljs")} {...props}>
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[0.85em]">
                                {children}
                            </code>
                        );
                    },
                    pre: ({ children }) => (
                        <pre className="mb-3 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-raised)] p-3 text-[13px] last:mb-0">
                            {children}
                        </pre>
                    ),
                    table: ({ children }) => (
                        <div className="mb-3 overflow-x-auto">
                            <table className="w-full border-collapse text-sm">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 text-left font-medium">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-[var(--color-border-subtle)] px-2 py-1">
                            {children}
                        </td>
                    ),
                    hr: () => <hr className="my-4 border-[var(--color-border-subtle)]" />,
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
});
