import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kubusin.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kubusin — Kubus Rubik 3D di Browser",
    template: "%s · Kubusin",
  },
  description:
    "Kubus Rubik 3D yang dimainkan di browser. Putar sisi dengan keyboard atau sentuhan, acak kubus, ukur waktu, dan simpan sepuluh rekor terbaikmu.",
  applicationName: "Kubusin",
  keywords: [
    "kubusin",
    "rubik",
    "rubik's cube",
    "kubus rubik 3d",
    "game kubus",
    "speedcubing",
    "game browser",
  ],
  authors: [{ name: "Kubusin" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: siteUrl,
    siteName: "Kubusin",
    title: "Kubusin — Kubus Rubik 3D di Browser",
    description:
      "Kubus Rubik 3D yang dimainkan lewat keyboard. Acak, putar tiap sisi, ukur waktu, dan kejar rekor terbaikmu.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kubusin — Kubus Rubik 3D di Browser",
    description:
      "Kubus Rubik 3D yang dimainkan lewat keyboard. Acak, putar tiap sisi, ukur waktu, dan kejar rekor terbaikmu.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

/**
 * Runs before paint so a stored theme is on <html> with no flash. Kept as a
 * literal here: the layout is static, so this ships in the initial HTML.
 */
const themeScript = `(function(){try{var t=localStorage.getItem("kubusin.theme.v1");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${spaceGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-bg text-ink">{children}</body>
    </html>
  );
}
