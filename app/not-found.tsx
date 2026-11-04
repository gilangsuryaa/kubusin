import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-6 py-16">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-soft">
        Error 404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Halaman ini tidak ada
      </h1>
      <p className="text-sm leading-relaxed text-ink-soft">
        Kubusnya masih di tempat lain. Kembali ke papan untuk melanjutkan
        permainan.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex min-h-11 w-fit items-center rounded-[3px] border border-line-strong px-4 text-[13px] font-medium transition-colors hover:bg-ink/[0.06]"
      >
        Kembali bermain
      </Link>
    </main>
  );
}
