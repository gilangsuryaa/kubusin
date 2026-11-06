"use client";

import dynamic from "next/dynamic";

/**
 * The 3D scene is browser-only: three.js touches `window`, WebGL and rAF, so
 * it is loaded with `ssr: false` and stays out of the server bundle.
 */
export const CubeCanvas = dynamic(() => import("./CubeScene"), {
  ssr: false,
  loading: () => <span className="sr-only">Memuat kubus 3D…</span>,
});
