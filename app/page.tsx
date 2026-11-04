import { GameShell } from "@/components/GameShell";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Kubus Rubik 3D",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  inLanguage: "id",
  browserRequirements: "Membutuhkan WebGL",
  offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  description:
    "Rubik's Cube 3D yang dimainkan lewat keyboard atau sentuhan: acak, putar tiap sisi, ukur waktu, dan simpan sepuluh rekor terbaik.",
};

export default function Page() {
  return (
    <main>
      <GameShell />
      <script
        type="application/ld+json"
        // Structured data is static and fully controlled here.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </main>
  );
}
