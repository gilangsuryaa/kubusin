# Kubus Rubik 3D

Rubik's Cube 3D yang dimainkan langsung di browser: putar tiap sisi lewat
keyboard atau sentuhan, acak kubus, ukur waktu, dan simpan sepuluh rekor
terbaikmu di perangkat.

Dibangun dengan Next.js (App Router) + TypeScript strict, Tailwind CSS,
three.js melalui `@react-three/fiber` dan `@react-three/drei`, serta Zustand
untuk state permainan.

## Fitur

- Kubus 3x3 dengan 27 cubie, bodi hitam bersudut sedikit membulat dan enam
  warna sisi standar (putih atas, kuning bawah, hijau depan, biru belakang,
  merah kanan, oranye kiri).
- Rotasi layer dianimasikan halus (170 ms, easing) dan langkah yang ditekan
  beruntun masuk antrean, jadi tidak ada langkah yang hilang.
- Timer mulai otomatis pada langkah pertama setelah acak dan berhenti saat
  kubus selesai, lengkap dengan penghitung langkah.
- Rekor hanya dicatat untuk sesi yang dimulai dengan acak (`Spasi`). Memutar
  satu sisi sampai kembali utuh tanpa acak tidak dianggap penyelesaian.
- **Orientasi kubus bisa diatur**: pilih warna mana yang menghadap depan (F)
  dan atas (U). Kubus diputar agar cocok dan huruf tombol ikut menyesuaikan,
  jadi rumus bisa langsung dimasukkan sesuai warna yang kamu lihat.
- **Rotasi seluruh kubus** lewat `x` `y` `z` (masing-masing mengikuti arah
  `R`, `U`, `F`), lengkap dengan versi berlawanan arah. Ini memutar kubus
  seperti di tangan tanpa mengubah keadaan puzzlenya.
- **Slice moves** `M` `E` `S` memutar lapisan tengah (masing-masing mengikuti
  arah `L`, `D`, `F`). Slice mengubah susunan puzzle seperti langkah biasa,
  tetapi **tidak** mengubah orientasi kubus.
- **Wide moves** diaktifkan dengan `W` lalu memutar sisi mana pun; sisi itu dan
  lapisan tengahnya berputar bersama (`Rw`, `Uw`, ...). Wide moves mengubah
  susunan puzzle seperti langkah biasa, tetapi **tidak** mengubah orientasi.
- Deteksi selesai yang benar: memeriksa warna tiap sisi, bukan sekadar posisi.
- Reset (`Enter` atau tombol **Reset**) meminta konfirmasi dulu, jadi tidak
  terpencet ulang secara tidak sengaja.
- Sepuluh rekor terbaik disimpan di `localStorage`.
- Kamera bisa diputar dengan drag (mouse atau sentuhan), zoom dibatasi, tanpa
  pan. Tombol panah juga memutar kamera.
- Panel bantuan keyboard, overlay kemenangan, dan tombol di layar untuk
  pengguna mobile.
- Mode terang dan gelap bisa diganti lewat tombol tema di header. Tanpa pilihan
  tersimpan, tampilan mengikuti preferensi sistem; pilihanmu diingat di
  `localStorage`. Animasi masuk dihormati `prefers-reduced-motion`.

## Menjalankan

Butuh Node.js 20+ dan pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

Perintah lain:

```bash
pnpm build      # build produksi
pnpm start      # jalankan hasil build
pnpm lint       # ESLint
pnpm test       # unit test (Vitest)
```

## Kontrol

| Tombol | Aksi |
| --- | --- |
| `U` `D` `L` `R` `F` `B` | Putar sisi searah jarum jam (Atas, Bawah, Kiri, Kanan, Depan, Belakang) |
| `Shift` + huruf | Putar sisi berlawanan arah jarum jam |
| `M` `E` `S` | Putar lapisan tengah (M ikut `L`, E ikut `D`, S ikut `F`) |
| `Shift` + `M`/`E`/`S` | Putar lapisan tengah berlawanan arah |
| `W` | Aktifkan/nonaktifkan wide moves (sisi + lapisan tengah) |
| `x` `y` `z` | Putar seluruh kubus mengikuti arah `R`, `U`, `F` |
| `Shift` + `x`/`y`/`z` | Putar seluruh kubus berlawanan arah (x', y', z') |
| `←` `↑` `→` `↓` | Putar kamera |
| `Spasi` | Acak kubus (20–25 langkah acak) dan mulai sesi |
| `Backspace` | Urungkan langkah terakhir |
| `Enter` | Reset ke kondisi selesai (dengan dialog konfirmasi) |
| `?` | Buka atau tutup panel bantuan |

Mouse dan sentuhan:

- **Seret** pada kubus: putar kamera.
- **Scroll** atau **cubit**: zoom.
- Tombol di layar (`Acak`, `Urungkan`, `Reset`, toggle `W`, 12 tombol arah, dan
  6 tombol slice) melakukan hal yang sama seperti keyboard, untuk perangkat
  sentuh. Saat wide aktif, tombol arah memutar dua lapisan (`Rw`, `Uw`, ...).
- Tombol tema di header berganti antara mode terang dan gelap kapan saja.

Orientasi:

- Panel **Orientasi** di sisi kanan mengatur warna mana yang dianggap depan
  (`F`) dan atas (`U`). Contoh: pilih **Biru** di baris `Depan · F` untuk
  membuat sisi biru menjadi depan, atau pilih **Kuning** di baris `Atas · U`
  agar sisi putih menjadi bawah (`D`).
- Kubus 3D ikut diputar agar warna pilihan benar-benar menghadap depan/atas,
  dan tombol `U` `D` `L` `R` `F` `B` memutar sisi fisik yang sesuai. Legenda
  **Huruf dan warna** menampilkan pemetaan yang sedang aktif.
- Pilihan ini hanya mengubah cara memegang kubus, bukan keadaan kubusnya, dan
  tetap dipakai setelah langkah, undo, maupun reset.
- Tombol `x` `y` `z` (dan `Shift` + `x`/`y`/`z`) memutar seluruh kubus
  mengikuti arah `R`/`U`/`F`. Pilihan di panel Orientasi ikut bergeser karena
  keduanya memakai model "cara memegang" yang sama.
- Hanya rotasi seluruh kubus (`x` `y` `z`) dan pemilihan manual di panel
  Orientasi yang mengubah orientasi. Slice moves (`M` `E` `S`), wide moves
  (`Rw` dan kawan-kawan), dan langkah sisi biasa tidak mengubahnya.

Ketika kubus selesai, waktu dan jumlah langkah tampil di overlay kemenangan
beserta tombol **Main lagi**. Input keyboard diabaikan selama ada modal
terbuka.

## Struktur

```
app/                     layout, halaman, 404, ikon, gambar Open Graph
components/
  cube/                  seluruh rendering 3D (Canvas, cubie, animasi layer,
                         rotasi orientasi)
  ui/                    tombol, panel statistik, rekor, orientasi, bantuan,
                         overlay
components/GameShell.tsx  penyusun UI + penghubung store dan keyboard
hooks/                   useKeyboard, useElapsed, useMediaQuery
lib/
  cube.ts                model kubus murni (tanpa three.js), 27 cubie
  cube.test.ts           unit test model
  easing.ts, format.ts   helper murni
  cubeColors.ts          palet sisi
  cameraBus.ts           bus kecil untuk memutar kamera dari keyboard
store/game.ts            state permainan (langkah, antrean, timer, rekor)
```

## Arsitektur

- **Logika terpisah dari tampilan.** `lib/cube.ts` menyimpan state kubus,
  menerapkan langkah, mengacak, dan memeriksa selesai. Modul ini tidak
  mengimpor three.js atau React sehingga bisa diuji langsung dengan Node.
- **Tanpa galat pembulatan.** Posisi dan orientasi cubie disimpan sebagai
  bilangan bulat (koordinat dan matriks rotasi 3x3), bukan floating point,
  sehingga perbandingan state selalu eksak.
- **Animasi terkendali di luar React.** `components/cube/CubeRig.tsx`
  memperbarui 27 grup cubie secara imperatif di dalam satu `useFrame`, jadi
  React tidak pernah render ulang per frame.
- **Antrean langkah.** Tekanan tombol berturut-turut masuk ke antrean di
  Zustand; satu langkah menjadi `active` dan baru dikomit saat animasinya
  selesai, jadi tidak ada langkah yang hilang.
- **Render sesuai kebutuhan.** `Canvas` memakai `frameloop="demand"` dan
  menggambar ulang hanya saat ada animasi atau input kamera.
- **Geometri dan material dipakai ulang.** Satu geometri bodi dan satu
  geometri stiker dibuat sekali per scene lalu dipakai bersama oleh 27 cubie
  dan 54 stiker, dan dilepas kembali saat unmount. Peta pantulan dibuat lokal
  dari enam permukaan gradien kecil (`CubeTexture`), tanpa unduhan aset
  eksternal. Peta ini sengaja tidak memakai PMREM karena shader
  environment-nya memicu peringatan presisi `X4122` dari kompiler ANGLE/D3D11
  di Windows; material Phong dengan peta kubus biasa memberi kilau lembut
  tanpa peringatan konsol.
- **Aksesibilitas.** Semua tombol punya label ARIA, fokus keyboard terlihat,
  dialog menahan fokus dan mengunci scroll, dan status "Kubus selesai"
  diumumkan lewat `aria-live`.

## Test

`lib/cube.test.ts` menjalankan Vitest dan mencakup:

- langkah lalu kebalikannya harus kembali ke state awal;
- empat putaran sisi yang sama = identitas;
- dua putaran searah = dua putaran berlawanan (putaran setengah);
- `isSolved` benar untuk kubus utuh, salah setelah satu langkah, dan salah
  untuk sudut yang terpelintir meski posisinya tidak berubah;
- acak tidak memutar sisi yang sama dua kali berturut-turut, panjangnya
  20–25 langkah, dan selalu bisa dikembalikan ke keadaan semula;
- orientasi memetakan tiap warna ke huruf yang benar dan arah putar di layar
  sama dengan arah putar algoritmanya, untuk semua 24 cara memegang yang sah;
- rotasi seluruh kubus `x` `y` `z` menghasilkan hold yang benar (termasuk
  contoh biru-depan/putih-bawah), empat putaran kembali semula, dan rotasi
  diikuti kebalikannya saling meniadakan;
- slice `M` `E` `S` hanya memutar lapisan tengah, arahnya mengikuti `L`/`D`/`F`
  di semua cara memegang, dan empat putaran (atau diikuti kebalikannya)
  kembali ke kondisi semula;
- wide `Rw` (dan semua sisi lain) memutar sisi + lapisan tengah, sama dengan
  langkah sisi ditambah slice yang cocok, tidak menyentuh lapisan terjauh,
  tidak mengubah orientasi, dan empat putaran kembali ke kondisi semula;
- penyelesaian hanya dicatat kalau sesi dimulai dengan acak, jadi memutar satu
  sisi empat kali pada kubus utuh tidak menghasilkan rekor.

```bash
pnpm test
```

## Deploy ke Vercel

Tanpa konfigurasi tambahan.

1. Dorong repositori ini ke GitHub (atau GitLab/Bitbucket).
2. Di Vercel, pilih **Add New → Project**, lalu impor repositori tersebut.
3. Vercel mendeteksi Next.js dan pnpm secara otomatis: build command
   `pnpm build`, output standar Next.js.
4. Klik **Deploy**. Selesai.
5. Opsional: set environment variable `NEXT_PUBLIC_SITE_URL` ke domain
   produksi (mis. `https://rubik-3d.vercel.app`) agar URL kanonik dan gambar
   Open Graph memakai alamat yang benar.

Atau lewat CLI:

```bash
pnpm dlx vercel
```

## Lisensi

MIT.
