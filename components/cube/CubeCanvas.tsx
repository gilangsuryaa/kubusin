"use client";

import dynamic from "next/dynamic";
import { CubePoster } from "./CubePoster";

/**
 * The 3D scene is browser-only: three.js touches `window`, WebGL and rAF, so
 * it is loaded with `ssr: false` and stays out of the server bundle. While the
 * chunk loads the lightweight poster stands in, so the hero is never empty.
 */
export const CubeCanvas = dynamic(() => import("./CubeScene"), {
  ssr: false,
  loading: () => (
    <>
      <CubePoster />
      <span className="sr-only">Memuat kubus 3D...</span>
    </>
  ),
});
