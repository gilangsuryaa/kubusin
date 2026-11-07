"use client";

import dynamic from "next/dynamic";
import { useT } from "@/hooks/useT";

/** Placeholder announced while the WebGL scene chunk loads. */
function CubeLoading() {
  const t = useT();
  return <span className="sr-only">{t("cube.loading")}</span>;
}

/**
 * The 3D scene is browser-only: three.js touches `window`, WebGL and rAF, so
 * it is loaded with `ssr: false` and stays out of the server bundle.
 */
export const CubeCanvas = dynamic(() => import("./CubeScene"), {
  ssr: false,
  loading: () => <CubeLoading />,
});
