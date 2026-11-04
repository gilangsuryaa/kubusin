"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three-stdlib";
import type { Face } from "@/lib/cube";
import { CUBE_BODY_COLOR, FACE_COLORS } from "@/lib/cubeColors";

/** One cubie is 0.97 wide, so neighbours keep a hairline gap. */
export const CUBIE_SIZE = 0.97;
const CUBIE_RADIUS = 0.085;
const CUBIE_SEGMENTS = 3;
/** Stickers sit a hair above the flat part of the rounded body. */
export const STICKER_OFFSET = 0.492;
const STICKER_SIZE = 0.76;
const STICKER_RADIUS = 0.07;

/** Flat rounded square, the classic raised sticker look without extra depth. */
function roundedSquareGeometry(size: number, radius: number): THREE.ShapeGeometry {
  const half = size / 2;
  const r = Math.min(radius, half);
  const shape = new THREE.Shape();
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);
  return new THREE.ShapeGeometry(shape, 4);
}

export interface CubeAssets {
  bodyGeometry: THREE.BufferGeometry;
  stickerGeometry: THREE.BufferGeometry;
  bodyMaterial: THREE.Material;
  stickerMaterials: Record<Face, THREE.Material>;
}

/**
 * Geometry and materials are created once per mounted scene and shared by all
 * 27 cubies and 54 stickers, then released on unmount.
 *
 * Materials are Phong rather than physical: matte vinyl stickers and slightly
 * glossy plastic are exactly what Phong models, and the reflection map needs no
 * prefiltering, which keeps the first frame cheap.
 */
export function useCubeAssets(environment: THREE.CubeTexture | null): CubeAssets {
  const geometries = useMemo(
    () => ({
      bodyGeometry: new RoundedBoxGeometry(
        CUBIE_SIZE,
        CUBIE_SIZE,
        CUBIE_SIZE,
        CUBIE_SEGMENTS,
        CUBIE_RADIUS,
      ),
      stickerGeometry: roundedSquareGeometry(STICKER_SIZE, STICKER_RADIUS),
    }),
    [],
  );

  const materials = useMemo(() => {
    const stickerMaterials = {} as Record<Face, THREE.Material>;
    for (const face of Object.keys(FACE_COLORS) as Face[]) {
      stickerMaterials[face] = new THREE.MeshPhongMaterial({
        color: new THREE.Color(FACE_COLORS[face]),
        shininess: 60,
        specular: new THREE.Color("#141414"),
        envMap: environment,
        reflectivity: 0.05,
        combine: THREE.AddOperation,
      });
    }
    return {
      bodyMaterial: new THREE.MeshPhongMaterial({
        color: new THREE.Color(CUBE_BODY_COLOR),
        shininess: 110,
        specular: new THREE.Color("#3d3d3d"),
        envMap: environment,
        reflectivity: 0.03,
        combine: THREE.AddOperation,
      }),
      stickerMaterials,
    };
  }, [environment]);

  useEffect(
    () => () => {
      geometries.bodyGeometry.dispose();
      geometries.stickerGeometry.dispose();
    },
    [geometries],
  );

  useEffect(
    () => () => {
      materials.bodyMaterial.dispose();
      for (const material of Object.values(materials.stickerMaterials)) {
        material.dispose();
      }
    },
    [materials],
  );

  return { ...geometries, ...materials };
}
