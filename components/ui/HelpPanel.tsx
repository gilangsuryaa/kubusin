"use client";

import type { ReactNode } from "react";
import { ColorLegend } from "./ColorLegend";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

function Keys({ children }: { children: ReactNode }) {
  return <span className="flex flex-wrap items-center gap-1">{children}</span>;
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-[3px] border border-line-strong bg-bg-elev px-1.5 py-0.5 text-[11px] font-medium text-ink">
      {children}
    </kbd>
  );
}

const KEY_ROWS: { keys: string[]; description: string }[] = [
  { keys: ["U", "D", "L", "R", "F", "B"], description: "Putar sisi searah jarum jam" },
  { keys: ["Shift", "+ huruf"], description: "Putar sisi berlawanan arah jarum jam" },
  { keys: ["M", "E", "S"], description: "Putar lapisan tengah (M ikut L, E ikut D, S ikut F)" },
  { keys: ["Shift", "+ M/E/S"], description: "Putar lapisan tengah berlawanan arah" },
  { keys: ["W"], description: "Aktifkan/nonaktifkan wide moves: sisi + lapisan tengah (mis. Rw)" },
  { keys: ["x", "y", "z"], description: "Putar seluruh kubus (x ikut R, y ikut U, z ikut F)" },
  { keys: ["Shift", "+ x/y/z"], description: "Putar seluruh kubus berlawanan arah" },
  { keys: ["←", "↑", "→", "↓"], description: "Putar kamera" },
  { keys: ["Spasi"], description: "Acak kubus dan mulai sesi (20–25 langkah)" },
  { keys: ["Backspace"], description: "Urungkan langkah terakhir" },
  { keys: ["Enter"], description: "Reset ke kondisi selesai (dengan konfirmasi)" },
  { keys: ["?"], description: "Buka atau tutup panel ini" },
];

const POINTER_ROWS: { keys: string[]; description: string }[] = [
  { keys: ["Seret"], description: "Putar kamera" },
  { keys: ["Scroll"], description: "Zoom in dan out" },
  { keys: ["Cubit"], description: "Zoom di layar sentuh" },
];

export function HelpPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} labelledBy="help-title" onClose={onClose}>
      <div className="max-h-[82vh] overflow-y-auto p-5 sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
              Bantuan
            </p>
            <h2 id="help-title" className="mt-1 text-xl font-semibold tracking-tight">
              Kontrol
            </h2>
          </div>
          <Button
            variant="bare"
            size="icon"
            onClick={onClose}
            aria-label="Tutup bantuan"
            data-autofocus="true"
          >
            <span aria-hidden="true">✕</span>
          </Button>
        </header>

        <dl className="mt-5 divide-y divide-line">
          {KEY_ROWS.map((row) => (
            <div key={row.description} className="flex items-baseline gap-4 py-2.5">
              <dt className="shrink-0">
                <Keys>
                  {row.keys.map((key) => (
                    <Key key={key}>{key}</Key>
                  ))}
                </Keys>
              </dt>
              <dd className="text-xs text-ink-soft">{row.description}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Rekor hanya dicatat untuk sesi yang dimulai dengan acak (Spasi).
          Memutar kubus yang sudah selesai tidak dihitung sebagai penyelesaian.
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          Panel Panduan menampilkan langkah penyelesaian bertahap dan menyorot
          langkah berikutnya. Saat panduan aktif, orientasi dikunci ke standar
          dan waktu tidak masuk rekor. Solusi optimal dihitung sekali lalu tetap
          sama selama langkahnya kamu ikuti.
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          Panel Pencatat gerakan mencatat urutan acakan dan setiap langkah yang
          kamu putar, dalam notasi, untuk dianalisis atau disalin.
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          Setiap putaran berbunyi klik dan kubus selesai memainkan nada singkat.
          Tombol pengeras suara di header menyalakan atau mematikan suara, dan
          pilihannya disimpan di perangkat.
        </p>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
          Hanya rotasi seluruh kubus (x y z) dan pemilihan manual di panel
          Orientasi yang mengubah orientasi. Langkah biasa, slice (M E S), dan
          wide moves (W) tidak mengubahnya.
        </p>

        <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          Mouse dan sentuhan
        </h3>
        <dl className="mt-2 divide-y divide-line">
          {POINTER_ROWS.map((row) => (
            <div key={row.description} className="flex items-baseline gap-4 py-2.5">
              <dt className="w-16 shrink-0 text-xs font-medium">{row.keys[0]}</dt>
              <dd className="text-xs text-ink-soft">{row.description}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
          Huruf dan warna
        </h3>
        <ColorLegend className="mt-3" />
        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Atur panel Orientasi untuk memilih warna yang dianggap depan dan
          atas; huruf tombol akan mengikuti pilihan itu.
        </p>
      </div>
    </Dialog>
  );
}
