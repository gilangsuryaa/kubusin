"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "tile" | "bare";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border border-transparent bg-accent text-accent-ink hover:brightness-[1.06] active:brightness-95",
  outline:
    "border border-line-strong text-ink hover:bg-ink/[0.06] active:bg-ink/[0.11]",
  tile: "border border-line text-ink hover:border-line-strong hover:bg-ink/[0.06] active:bg-ink/[0.11]",
  bare: "border border-transparent text-ink-soft hover:text-ink hover:bg-ink/[0.06]",
};

const SIZES: Record<"md" | "sm" | "icon", string> = {
  md: "min-h-11 px-3 text-[13px]",
  sm: "min-h-9 px-2.5 text-xs",
  icon: "h-11 w-11 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "md" | "sm" | "icon";
  children: ReactNode;
}

export function Button({
  variant = "outline",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 rounded-[3px] font-medium tracking-wide transition-[background-color,border-color,color,filter] disabled:cursor-not-allowed disabled:opacity-35 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
