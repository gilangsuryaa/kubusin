export type Locale = "id" | "en";

export const LOCALES: readonly Locale[] = ["id", "en"];

/** Stored key for the language preference. */
export const LOCALE_STORAGE_KEY = "kubusin.locale.v1";

/** BCP-47 tags used for dates and `<html lang>`. */
export const LOCALE_TAG: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
};

const id = {
  // Shared words.
  "common.time": "Waktu",
  "common.moves": "Langkah",
  "common.movesCount": "{count} langkah",
  "common.copy": "Salin",
  "common.copied": "Tersalin",
  "common.close": "Tutup",
  "common.cancel": "Batal",

  // GameShell / page chrome.
  "app.tagline":
    "Putar tiap sisi lewat keyboard atau sentuhan. Waktu mulai pada langkah pertama dan berhenti saat kubus selesai.",
  "shell.helpAria": "Buka bantuan kontrol",
  "shell.boardAria": "Papan kubus",
  "shell.hint":
    "Seret kubus untuk memutar kamera, scroll atau cubit untuk zoom. Buka panel bantuan untuk daftar lengkap tombol keyboard.",
  "shell.lettersColors": "Huruf dan warna",
  "shell.githubAria": "Kode sumber di GitHub",

  // Stats panel.
  "stats.aria": "Statistik permainan",
  "status.idle": "Kubus selesai. Tekan Spasi untuk acak dan mulai.",
  "status.scrambling": "Mengacak...",
  "status.ready": "Putar sisi mana saja untuk memulai waktu.",
  "status.running": "Berjalan...",
  "status.solved": "Selesai!",

  // Move tracker.
  "tracker.title": "Pencatat gerakan",
  "tracker.empty":
    "Catatan langkah muncul di sini. Tekan Spasi untuk mengacak, lalu putar sisi mana saja.",
  "tracker.scramble": "Acakan",
  "tracker.yourMoves": "Langkahmu",
  "tracker.scrambleAria": "Langkah acakan",
  "tracker.yourMovesAria": "Langkah yang kamu lakukan",
  "tracker.noMoves": "Belum ada langkah.",
  "tracker.clipScramble": "Acakan: {moves}",
  "tracker.clipMoves": "Langkah: {moves}",

  // Best times.
  "best.aria": "Waktu terbaik",
  "best.title": "Rekor terbaik",
  "best.empty":
    "Belum ada catatan. Tekan Spasi untuk mengacak, lalu selesaikan kubus.",

  // Live region (screen reader).
  "live.solved": "Kubus selesai. Waktu {time} dengan {count} langkah.",
  "live.scrambling": "Mengacak kubus.",
  "live.ready": "Kubus teracak. Waktu mulai pada langkah pertama.",

  // Theme toggle.
  "theme.switchToLight": "Ganti ke tema terang",
  "theme.switchToDark": "Ganti ke tema gelap",
  "theme.darkAria": "Tema gelap",

  // Sound toggle.
  "sound.aria": "Efek suara",
  "sound.mute": "Matikan efek suara",
  "sound.unmute": "Nyalakan efek suara",

  // Language toggle.
  "lang.aria": "Bahasa",
  "lang.switchToEnglish": "Ganti ke bahasa Inggris",
  "lang.switchToIndonesian": "Ganti ke bahasa Indonesia",

  // Face labels ("Depan", "Atas", ...).
  "face.label.U": "Atas",
  "face.label.D": "Bawah",
  "face.label.F": "Depan",
  "face.label.B": "Belakang",
  "face.label.R": "Kanan",
  "face.label.L": "Kiri",

  // Human colour names.
  "face.name.U": "Putih",
  "face.name.D": "Kuning",
  "face.name.F": "Hijau",
  "face.name.B": "Biru",
  "face.name.R": "Merah",
  "face.name.L": "Oranye",

  // Orientation panel.
  "orientation.role.front": "depan",
  "orientation.role.up": "atas",
  "orientation.title": "Orientasi",
  "orientation.resetTitle": "Kembalikan ke orientasi standar",
  "orientation.reset": "Standar",
  "orientation.locked": "Orientasi dikunci ke standar selama panduan aktif.",
  "orientation.help":
    "Pilih warna yang menghadap depan dan atas. Huruf F, U, dan lainnya mengikuti pilihan ini.",
  "orientation.frontGroupAria": "Warna sisi depan",
  "orientation.upGroupAria": "Warna sisi atas",
  "orientation.frontLabel": "Depan · F",
  "orientation.upLabel": "Atas · U",
  "orientation.swatchAria": "{face} — {color} sebagai sisi {role}",
  "orientation.swatchTitle": "{color} sebagai sisi {role}",
  "orientation.swatchBlocked": "{color} berseberangan dengan sisi {role}",

  // Control bar.
  "control.scramble": "Acak",
  "control.scrambleAria": "Acak kubus",
  "control.scrambleTitle": "Acak kubus (Spasi)",
  "control.undo": "Urungkan",
  "control.undoAria": "Urungkan langkah terakhir",
  "control.undoTitle": "Urungkan (Backspace)",
  "control.reset": "Reset",
  "control.resetAria": "Reset kubus ke kondisi selesai",
  "control.resetTitle": "Reset (Enter)",
  "control.wide": "Wide {state}",
  "control.wideOn": "aktif",
  "control.wideOff": "nonaktif",
  "control.wideModeAria":
    "Mode wide moves {state}: putar sisi bersama lapisan tengah",
  "control.wideTitle": "Wide moves: putar dua lapisan sekaligus (W)",
  "control.scopeWide": "dua lapisan",
  "control.scopeFace": "sisi",
  "control.faceDir.clockwise": "searah jarum jam",
  "control.faceDir.counter": "berlawanan arah jarum jam",
  "control.faceLabel": "{color} {direction}",
  "control.turnAria": "Putar {scope} {label} ({notation})",
  "control.turnTitle": "{notation} — {label}",
  "control.sliceGroupAria": "Putar lapisan tengah",
  "control.sliceDir.clockwise": "searah",
  "control.sliceDir.counter": "berlawanan arah",
  "control.sliceLabel": "{direction} {follows}",
  "control.sliceAria": "Putar lapisan tengah {label} ({notation})",
  "control.sliceTitle": "{notation} — lapisan tengah {label}",

  // Win overlay.
  "win.eyebrow": "Kubus selesai",
  "win.newBest": "Rekor baru.",
  "win.solved": "Kubus kembali utuh.",
  "win.notRecorded": "Mode panduan aktif, jadi waktu ini tidak masuk rekor.",
  "win.recordedBest": "Waktu ini tersimpan sebagai rekor terbaikmu.",
  "win.previousBest": "Rekor terbaikmu {time}.",
  "win.addedToRecords": "Waktu ini masuk ke daftar rekormu.",
  "win.playAgain": "Main lagi",

  // Reset dialog.
  "reset.title": "Reset kubus?",
  "reset.desc":
    "Kubus kembali ke kondisi selesai. Langkah dan waktu saat ini hilang, tetapi daftar rekor terbaik tetap tersimpan.",
  "reset.confirm": "Ya, reset",

  // Solve guide.
  "guide.title": "Panduan",
  "guide.on": "Aktif",
  "guide.turnOn": "Nyalakan",
  "guide.assistOnHint":
    "Ikuti langkah yang disorot. Orientasi dikunci ke standar dan waktu tidak masuk rekor.",
  "guide.assistOffHint":
    "Nyalakan untuk memilih metode dan melihat langkah penyelesaian lengkap.",
  "guide.methodGroupAria": "Metode penyelesaian",
  "guide.method.beginner.label": "Metode Pemula",
  "guide.method.beginner.title":
    "Selesaikan lapis demi lapis, dari cross bawah sampai lapis atas.",
  "guide.method.cfop.label": "CFOP",
  "guide.method.cfop.title":
    "Cross, F2L, lalu OLL dan PLL — metode cepat yang populer.",
  "guide.method.optimal.label": "Optimal",
  "guide.method.optimal.title":
    "Solusi terpendek dari keadaan kubus saat ini.",
  "guide.shortest": "Solusi terpendek",
  "guide.recompute": "Hitung ulang",
  "guide.computing": "Menghitung...",
  "guide.computingShortest": "Menghitung solusi terpendek...",
  "guide.computingSteps": "Menghitung langkah...",
  "guide.solved": "Kubus sudah selesai.",
  "guide.nextMove": "Langkah berikutnya:",
  "guide.movesLeft": "· {count} langkah lagi",
  "guide.done": "beres",
  "guide.optimalError": "Solusi optimal gagal dihitung.",
  "guide.stagedError": "Panduan gagal dihitung untuk susunan ini.",

  // Solver stage titles and details.
  "guide.stage.b.cross.title": "Cross lapisan bawah",
  "guide.stage.b.cross.detail":
    "Susun empat tepi kuning mengelilingi pusat kuning di sisi bawah.",
  "guide.stage.b.corners.title": "Sudut lapisan bawah",
  "guide.stage.b.corners.detail": "Masukkan empat sudut kuning ke lapisan bawah.",
  "guide.stage.b.middle.title": "Lapisan tengah",
  "guide.stage.b.middle.detail":
    "Selipkan empat tepi tengah yang tidak berwarna putih.",
  "guide.stage.b.whiteCross.title": "Cross lapisan atas",
  "guide.stage.b.whiteCross.detail": "Bentuk palang putih di sisi atas.",
  "guide.stage.b.ollCorners.title": "Orientasi sudut atas",
  "guide.stage.b.ollCorners.detail":
    "Balik sudut atas sampai warna putih menghadap atas.",
  "guide.stage.b.pllCorners.title": "Susun sudut atas",
  "guide.stage.b.pllCorners.detail":
    "Pindahkan sudut putih ke posisi akhirnya.",
  "guide.stage.b.pllEdges.title": "Susun tepi atas",
  "guide.stage.b.pllEdges.detail": "Pindahkan tepi putih agar kubus selesai.",
  "guide.stage.c.cross.title": "Cross",
  "guide.stage.c.cross.detail":
    "Susun cross kuning di sisi bawah, langsung dengan warna sisinya.",
  "guide.stage.c.f2l.title": "F2L pasangan {n}",
  "guide.stage.c.f2l.detail":
    "Satukan sudut dan tepi pasangan {n} lalu masukkan ke lapisan tengah.",
  "guide.stage.c.eoll.title": "OLL tepi (cross putih)",
  "guide.stage.c.eoll.detail": "Balik tepi atas sampai membentuk palang putih.",
  "guide.stage.c.ocll.title": "OLL sudut",
  "guide.stage.c.ocll.detail":
    "Putar sudut atas sampai seluruh sisi atas putih.",
  "guide.stage.c.cpll.title": "PLL sudut",
  "guide.stage.c.cpll.detail": "Pindahkan sudut atas ke posisi akhirnya.",
  "guide.stage.c.epll.title": "PLL tepi",
  "guide.stage.c.epll.detail": "Putar tepi atas sampai kubus selesai.",

  // Help panel.
  "help.eyebrow": "Bantuan",
  "help.title": "Kontrol",
  "help.closeAria": "Tutup bantuan",
  "help.row.faceCw": "Putar sisi searah jarum jam",
  "help.row.faceCcw": "Putar sisi berlawanan arah jarum jam",
  "help.row.middle": "Putar lapisan tengah (M ikut L, E ikut D, S ikut F)",
  "help.row.middleCcw": "Putar lapisan tengah berlawanan arah",
  "help.row.wide": "Aktifkan/nonaktifkan wide moves: sisi + lapisan tengah (mis. Rw)",
  "help.row.cube": "Putar seluruh kubus (x ikut R, y ikut U, z ikut F)",
  "help.row.cubeCcw": "Putar seluruh kubus berlawanan arah",
  "help.row.camera": "Putar kamera",
  "help.row.scramble": "Acak kubus dan mulai sesi (20–25 langkah)",
  "help.row.undo": "Urungkan langkah terakhir",
  "help.row.reset": "Reset ke kondisi selesai (dengan konfirmasi)",
  "help.row.help": "Buka atau tutup panel ini",
  "help.key.letter": "+ huruf",
  "help.key.middle": "+ M/E/S",
  "help.key.cube": "+ x/y/z",
  "help.key.space": "Spasi",
  "help.pointer.drag": "Seret",
  "help.pointer.dragDesc": "Putar kamera",
  "help.pointer.scroll": "Scroll",
  "help.pointer.scrollDesc": "Zoom in dan out",
  "help.pointer.pinch": "Cubit",
  "help.pointer.pinchDesc": "Zoom di layar sentuh",
  "help.rules":
    "Rekor hanya dicatat untuk sesi yang dimulai dengan acak (Spasi). Memutar kubus yang sudah selesai tidak dihitung sebagai penyelesaian.",
  "help.guide":
    "Panel Panduan menampilkan langkah penyelesaian bertahap dan menyorot langkah berikutnya. Saat dinyalakan, pilih metodenya: Metode Pemula (lapis demi lapis), CFOP (cross, F2L, OLL, PLL), atau Optimal (solusi terpendek). Saat panduan aktif, orientasi dikunci ke standar dan waktu tidak masuk rekor. Rencana tetap sama selama langkahnya kamu ikuti dan hanya dihitung ulang bila kubus keluar jalur.",
  "help.tracker":
    "Panel Pencatat gerakan mencatat urutan acakan dan setiap langkah yang kamu putar, dalam notasi, untuk dianalisis atau disalin.",
  "help.sound":
    "Setiap putaran berbunyi klik dan kubus selesai memainkan nada singkat. Tombol pengeras suara di header menyalakan atau mematikan suara, dan pilihannya disimpan di perangkat.",
  "help.orientation":
    "Hanya rotasi seluruh kubus (x y z) dan pemilihan manual di panel Orientasi yang mengubah orientasi. Langkah biasa, slice (M E S), dan wide moves (W) tidak mengubahnya.",
  "help.mouseTouch": "Mouse dan sentuhan",
  "help.lettersColors": "Huruf dan warna",
  "help.legend":
    "Atur panel Orientasi untuk memilih warna yang dianggap depan dan atas; huruf tombol akan mengikuti pilihan itu.",

  // 3D canvas loading.
  "cube.loading": "Memuat kubus 3D...",

  // Not found page.
  "notFound.error": "Error 404",
  "notFound.title": "Halaman ini tidak ada",
  "notFound.body":
    "Kubusnya masih di tempat lain. Kembali ke papan untuk melanjutkan permainan.",
  "notFound.cta": "Kembali bermain",
} as const;

export type MessageKey = keyof typeof id;

export type Vars = Record<string, string | number>;

const en: Record<MessageKey, string> = {
  "common.time": "Time",
  "common.moves": "Moves",
  "common.movesCount": "{count} moves",
  "common.copy": "Copy",
  "common.copied": "Copied",
  "common.close": "Close",
  "common.cancel": "Cancel",

  "app.tagline":
    "Turn each face with the keyboard or touch. The timer starts on your first move and stops when the cube is solved.",
  "shell.helpAria": "Open controls help",
  "shell.boardAria": "Cube board",
  "shell.hint":
    "Drag the cube to orbit the camera, scroll or pinch to zoom. Open the help panel for the full keyboard list.",
  "shell.lettersColors": "Letters and colours",
  "shell.githubAria": "Source code on GitHub",

  "stats.aria": "Game statistics",
  "status.idle": "Cube solved. Press Space to scramble and start.",
  "status.scrambling": "Scrambling...",
  "status.ready": "Turn any face to start the timer.",
  "status.running": "Running...",
  "status.solved": "Solved!",

  "tracker.title": "Move tracker",
  "tracker.empty":
    "The move log appears here. Press Space to scramble, then turn any face.",
  "tracker.scramble": "Scramble",
  "tracker.yourMoves": "Your moves",
  "tracker.scrambleAria": "Scramble moves",
  "tracker.yourMovesAria": "The moves you played",
  "tracker.noMoves": "No moves yet.",
  "tracker.clipScramble": "Scramble: {moves}",
  "tracker.clipMoves": "Moves: {moves}",

  "best.aria": "Best times",
  "best.title": "Best records",
  "best.empty": "No records yet. Press Space to scramble, then solve the cube.",

  "live.solved": "Cube solved. Time {time} with {count} moves.",
  "live.scrambling": "Scrambling the cube.",
  "live.ready": "Cube scrambled. The timer starts on your first move.",

  "theme.switchToLight": "Switch to light theme",
  "theme.switchToDark": "Switch to dark theme",
  "theme.darkAria": "Dark theme",

  "sound.aria": "Sound effects",
  "sound.mute": "Mute sound effects",
  "sound.unmute": "Unmute sound effects",

  "lang.aria": "Language",
  "lang.switchToEnglish": "Switch to English",
  "lang.switchToIndonesian": "Ganti ke bahasa Indonesia",

  "face.label.U": "Top",
  "face.label.D": "Bottom",
  "face.label.F": "Front",
  "face.label.B": "Back",
  "face.label.R": "Right",
  "face.label.L": "Left",

  "face.name.U": "White",
  "face.name.D": "Yellow",
  "face.name.F": "Green",
  "face.name.B": "Blue",
  "face.name.R": "Red",
  "face.name.L": "Orange",

  "orientation.role.front": "front",
  "orientation.role.up": "top",
  "orientation.title": "Orientation",
  "orientation.resetTitle": "Restore the standard orientation",
  "orientation.reset": "Standard",
  "orientation.locked": "Orientation is locked to standard while the guide is on.",
  "orientation.help":
    "Pick the colours facing front and top. The letters F, U and the rest follow this choice.",
  "orientation.frontGroupAria": "Front face colour",
  "orientation.upGroupAria": "Top face colour",
  "orientation.frontLabel": "Front · F",
  "orientation.upLabel": "Top · U",
  "orientation.swatchAria": "{face} — {color} as the {role} face",
  "orientation.swatchTitle": "{color} as the {role} face",
  "orientation.swatchBlocked": "{color} is opposite the {role} face",

  "control.scramble": "Scramble",
  "control.scrambleAria": "Scramble the cube",
  "control.scrambleTitle": "Scramble the cube (Space)",
  "control.undo": "Undo",
  "control.undoAria": "Undo the last move",
  "control.undoTitle": "Undo (Backspace)",
  "control.reset": "Reset",
  "control.resetAria": "Reset the cube to solved",
  "control.resetTitle": "Reset (Enter)",
  "control.wide": "Wide {state}",
  "control.wideOn": "on",
  "control.wideOff": "off",
  "control.wideModeAria":
    "Wide moves {state}: turn a face together with the middle layer",
  "control.wideTitle": "Wide moves: turn two layers at once (W)",
  "control.scopeWide": "two layers",
  "control.scopeFace": "face",
  "control.faceDir.clockwise": "clockwise",
  "control.faceDir.counter": "counter-clockwise",
  "control.faceLabel": "{color} {direction}",
  "control.turnAria": "Turn {scope} {label} ({notation})",
  "control.turnTitle": "{notation} — {label}",
  "control.sliceGroupAria": "Turn the middle layer",
  "control.sliceDir.clockwise": "clockwise",
  "control.sliceDir.counter": "counter-clockwise",
  "control.sliceLabel": "{direction} {follows}",
  "control.sliceAria": "Turn the middle layer {label} ({notation})",
  "control.sliceTitle": "{notation} — middle layer {label}",

  "win.eyebrow": "Cube solved",
  "win.newBest": "New record.",
  "win.solved": "Cube whole again.",
  "win.notRecorded": "The guide was on, so this time is not recorded.",
  "win.recordedBest": "This time is saved as your best record.",
  "win.previousBest": "Your best time is {time}.",
  "win.addedToRecords": "This time was added to your records.",
  "win.playAgain": "Play again",

  "reset.title": "Reset the cube?",
  "reset.desc":
    "The cube returns to solved. The current moves and time are lost, but your best records stay saved.",
  "reset.confirm": "Yes, reset",

  "guide.title": "Guide",
  "guide.on": "On",
  "guide.turnOn": "Turn on",
  "guide.assistOnHint":
    "Follow the highlighted move. Orientation is locked to standard and the time is not recorded.",
  "guide.assistOffHint":
    "Turn it on to pick a method and see the full solution.",
  "guide.methodGroupAria": "Solving method",
  "guide.method.beginner.label": "Beginner method",
  "guide.method.beginner.title":
    "Solve layer by layer, from the bottom cross to the top layer.",
  "guide.method.cfop.label": "CFOP",
  "guide.method.cfop.title":
    "Cross, F2L, then OLL and PLL — the popular speed method.",
  "guide.method.optimal.label": "Optimal",
  "guide.method.optimal.title":
    "The shortest solution from the current cube state.",
  "guide.shortest": "Shortest solution",
  "guide.recompute": "Recalculate",
  "guide.computing": "Computing...",
  "guide.computingShortest": "Computing the shortest solution...",
  "guide.computingSteps": "Computing the steps...",
  "guide.solved": "The cube is already solved.",
  "guide.nextMove": "Next move:",
  "guide.movesLeft": "· {count} moves left",
  "guide.done": "done",
  "guide.optimalError": "Could not compute the optimal solution.",
  "guide.stagedError": "Could not compute a guide for this arrangement.",

  "guide.stage.b.cross.title": "Bottom cross",
  "guide.stage.b.cross.detail":
    "Build the four yellow edges around the yellow centre on the bottom face.",
  "guide.stage.b.corners.title": "Bottom corners",
  "guide.stage.b.corners.detail": "Insert the four yellow corners into the bottom layer.",
  "guide.stage.b.middle.title": "Middle layer",
  "guide.stage.b.middle.detail":
    "Slot the four middle edges that have no white.",
  "guide.stage.b.whiteCross.title": "Top cross",
  "guide.stage.b.whiteCross.detail": "Form the white cross on top.",
  "guide.stage.b.ollCorners.title": "Orient the top corners",
  "guide.stage.b.ollCorners.detail":
    "Flip the top corners until white faces up.",
  "guide.stage.b.pllCorners.title": "Position the top corners",
  "guide.stage.b.pllCorners.detail":
    "Move the white corners to their final places.",
  "guide.stage.b.pllEdges.title": "Position the top edges",
  "guide.stage.b.pllEdges.detail": "Move the white edges so the cube is solved.",
  "guide.stage.c.cross.title": "Cross",
  "guide.stage.c.cross.detail":
    "Build the yellow cross on the bottom, matching the side colours.",
  "guide.stage.c.f2l.title": "F2L pair {n}",
  "guide.stage.c.f2l.detail":
    "Pair corner {n} with its edge and insert it into the middle layer.",
  "guide.stage.c.eoll.title": "OLL edges (white cross)",
  "guide.stage.c.eoll.detail": "Flip the top edges until they form the white cross.",
  "guide.stage.c.ocll.title": "OLL corners",
  "guide.stage.c.ocll.detail":
    "Turn the top corners until the whole top face is white.",
  "guide.stage.c.cpll.title": "PLL corners",
  "guide.stage.c.cpll.detail": "Move the top corners to their final places.",
  "guide.stage.c.epll.title": "PLL edges",
  "guide.stage.c.epll.detail": "Turn the top edges until the cube is solved.",

  "help.eyebrow": "Help",
  "help.title": "Controls",
  "help.closeAria": "Close help",
  "help.row.faceCw": "Turn a face clockwise",
  "help.row.faceCcw": "Turn a face counter-clockwise",
  "help.row.middle": "Turn the middle layer (M follows L, E follows D, S follows F)",
  "help.row.middleCcw": "Turn the middle layer the other way",
  "help.row.wide": "Toggle wide moves: face plus middle layer (e.g. Rw)",
  "help.row.cube": "Rotate the whole cube (x follows R, y follows U, z follows F)",
  "help.row.cubeCcw": "Rotate the whole cube the other way",
  "help.row.camera": "Orbit the camera",
  "help.row.scramble": "Scramble the cube and start a session (20–25 moves)",
  "help.row.undo": "Undo the last move",
  "help.row.reset": "Reset to solved (with confirmation)",
  "help.row.help": "Open or close this panel",
  "help.key.letter": "+ letter",
  "help.key.middle": "+ M/E/S",
  "help.key.cube": "+ x/y/z",
  "help.key.space": "Space",
  "help.pointer.drag": "Drag",
  "help.pointer.dragDesc": "Orbit the camera",
  "help.pointer.scroll": "Scroll",
  "help.pointer.scrollDesc": "Zoom in and out",
  "help.pointer.pinch": "Pinch",
  "help.pointer.pinchDesc": "Zoom on a touch screen",
  "help.rules":
    "Records only count for a session that started with a scramble (Space). Turning an already-solved cube is not counted as a solve.",
  "help.guide":
    "The Guide panel lists the solution step by step and highlights the next move. When it is on, pick the method: Beginner (layer by layer), CFOP (cross, F2L, OLL, PLL), or Optimal (the shortest solution). While the guide is on, the orientation is locked to standard and the time is not recorded. The plan stays the same as long as you follow its moves and is only recomputed if the cube leaves the path.",
  "help.tracker":
    "The Move tracker panel records the scramble and every turn you play, in notation, so you can analyse or copy it.",
  "help.sound":
    "Every turn clicks and a solved cube plays a short chime. The speaker button in the header turns the sound on or off, and the choice is saved on your device.",
  "help.orientation":
    "Only whole-cube rotations (x y z) and a manual pick in the Orientation panel change the orientation. Regular turns, slices (M E S), and wide moves (W) do not.",
  "help.mouseTouch": "Mouse and touch",
  "help.lettersColors": "Letters and colours",
  "help.legend":
    "Use the Orientation panel to pick which colours count as front and top; the button letters follow that choice.",

  "cube.loading": "Loading the 3D cube...",

  "notFound.error": "Error 404",
  "notFound.title": "This page does not exist",
  "notFound.body":
    "The cube is somewhere else. Head back to the board to keep playing.",
  "notFound.cta": "Back to the game",
};

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { id, en };

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/** Translate a key for a locale, filling `{name}` placeholders from `vars`. */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  const table = MESSAGES[locale] ?? MESSAGES.id;
  return interpolate(table[key] ?? MESSAGES.id[key] ?? key, vars);
}

export type TFunction = (key: MessageKey, vars?: Vars) => string;

/** Read the saved locale; defaults to Indonesian. Safe on the server. */
export function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "id";
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw === "en" ? "en" : "id";
  } catch {
    return "id";
  }
}

/** Persist the locale choice; storage failures are non-fatal. */
export function writeStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}

/** The other locale, used for one-tap switches. */
export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "id" : "en";
}

/** Keep `<html lang>` in step with the chosen locale. */
export function applyLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = LOCALE_TAG[locale];
}
