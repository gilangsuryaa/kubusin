"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/hooks/useT";
import { useGameStore } from "@/store/game";

export default function NotFound() {
  const t = useT();
  const hydrate = useGameStore((state) => state.hydrate);

  // The 404 page sits outside GameShell, so it hydrates the store itself to
  // pick up the saved language.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-6 py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-soft">
        {t("notFound.error")}
      </p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {t("notFound.title")}
      </h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        {t("notFound.body")}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 w-fit items-center rounded-[3px] border border-line-strong px-4 text-[13px] font-medium transition-colors hover:bg-ink/[0.06]"
      >
        {t("notFound.cta")}
      </Link>
    </main>
  );
}
