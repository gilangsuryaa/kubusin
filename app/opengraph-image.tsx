import { ImageResponse } from "next/og";

export const alt = "Kubusin — kubus Rubik 3D di browser lewat keyboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CELL_COLORS = ["#f8f7f4", "#e2372f", "#1b6fe3", "#ff7f1f", "#1c1b19", "#ffd23f", "#1fa85c", "#f8f7f4", "#e2372f"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#121110",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: "#ff7a3d",
            }}
          >
            Kubus Rubik 3D
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 84,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#f3f1ea",
            }}
          >
            Kubusin
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 30,
              lineHeight: 1.3,
              color: "#a6a196",
            }}
          >
            Mainkan lewat keyboard atau sentuhan. Acak, putar, ukur waktu, dan
            kejar rekor terbaikmu.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: 18,
            background: "#0c0c0c",
            borderRadius: 28,
          }}
        >
          {[0, 1, 2].map((row) => (
            <div key={row} style={{ display: "flex", gap: 12 }}>
              {[0, 1, 2].map((column) => (
                <div
                  key={column}
                  style={{
                    display: "flex",
                    width: 96,
                    height: 96,
                    borderRadius: 10,
                    background: CELL_COLORS[row * 3 + column],
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
