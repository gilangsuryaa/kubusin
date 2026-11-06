"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

const TEXTURE_SIZE = 256;

/**
 * A soft round shadow painted straight into a canvas, sampled as a plain
 * texture instead of being baked by an extra depth pass. The previous
 * `ContactShadows frames={Infinity}` re-rendered the whole scene into a 512px
 * target plus four fullscreen blur passes on every animated frame, which is the
 * single most expensive thing the rig did. A radial gradient reads the same
 * under the cube and costs one textured quad.
 */
function softShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const center = TEXTURE_SIZE / 2;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, "rgba(255,255,255,0.85)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.4)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

interface ShadowBlobProps {
  position: [number, number, number];
  scale: number;
  opacity: number;
  color: string;
}

/**
 * Static ground shadow: a horizontal quad tinted to the requested colour. The
 * gradient is colour-neutral, so a theme change only touches `material.color`,
 * not the uploaded texture.
 */
export function ShadowBlob({ position, scale, opacity, color }: ShadowBlobProps) {
  const texture = useMemo(() => softShadowTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={scale}
      renderOrder={-1}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}
