"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * A soft studio "environment" built by hand: six small canvas faces with a
 * vertical gradient each, combined into a `CubeTexture` and used as a plain
 * reflection map.
 *
 * This deliberately avoids both PMREM (whose physical-material environment
 * shader makes the ANGLE/D3D11 compiler emit `X4122` precision warnings) and a
 * live `CubeCamera` (which produced visible ghosting on this hardware). A
 * hand-painted cube map is stable, needs no extra passes and no bundled files.
 */
const FACE_GRADIENTS: readonly (readonly [string, string])[] = [
  // order: +x, -x, +y, -y, +z, -z
  ["#f2f3f5", "#b9bcc2"],
  ["#7d8087", "#3b3d42"],
  ["#fdfdfb", "#c8ccd4"],
  ["#1d1c1a", "#43413c"],
  ["#f6efe4", "#c3bcae"],
  ["#fbf3e8", "#b6ada0"],
];

const FACE_SIZE = 64;

function gradientFace(top: string, bottom: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = FACE_SIZE;
  canvas.height = FACE_SIZE;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, FACE_SIZE);
    gradient.addColorStop(0, top);
    gradient.addColorStop(1, bottom);
    context.fillStyle = gradient;
    context.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  }
  return canvas;
}

function createStudioCubeTexture(): THREE.CubeTexture {
  const faces = FACE_GRADIENTS.map(([top, bottom]) => gradientFace(top, bottom));
  const texture = new THREE.CubeTexture(faces);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Builds the reflection map once and hands it to the scene. */
export function useStudioEnvironment(): THREE.CubeTexture | null {
  const invalidate = useThree((state) => state.invalidate);
  const [environment, setEnvironment] = useState<THREE.CubeTexture | null>(null);

  useEffect(() => {
    const texture = createStudioCubeTexture();
    // Publish on the next frame so the update lands outside the effect body.
    const frame = requestAnimationFrame(() => {
      setEnvironment(texture);
      invalidate();
    });
    return () => {
      cancelAnimationFrame(frame);
      texture.dispose();
    };
  }, [invalidate]);

  return environment;
}
