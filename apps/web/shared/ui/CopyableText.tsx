"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CopyableTextProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  copiedLabel?: string;
  copyLabel?: string;
  copyValue?: string;
  value: string;
}

export function CopyableText({
  children,
  className,
  copiedLabel = "Скопировано",
  copyLabel = "Скопировать",
  copyValue,
  value,
  ...props
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);
  const copyText = copyValue ?? value;

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1600);

    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const Icon = copied ? Check : Copy;
  const label = copied ? copiedLabel : copyLabel;

  return (
    <div
      className={cn(
        "group relative min-w-0 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 pr-12 font-mono text-sm leading-6 text-foreground shadow-xs",
        className,
      )}
      {...props}
    >
      <code className="block break-all font-mono text-sm leading-6 text-foreground" translate="no">
        {children ?? value}
      </code>
      <button
        aria-label={label}
        className={cn(
          "absolute right-2 top-2 flex size-8 touch-manipulation items-center justify-center rounded-[var(--radius-md)] border border-border bg-background text-muted-foreground opacity-100 shadow-xs transition-[background-color,border-color,color,opacity,box-shadow] duration-150 hover:border-border-strong hover:bg-muted hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:opacity-0 sm:focus-visible:opacity-100 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100",
          copied && "border-success-soft bg-success-soft text-success-strong opacity-100 sm:opacity-100",
        )}
        onClick={handleCopy}
        title={label}
        type="button"
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
