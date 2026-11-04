"use client";

import type { Ref } from "react";
import * as THREE from "three";
import { faceForNormal, stickerNormals, type Cubie } from "@/lib/cube";
import { STICKER_OFFSET, type CubeAssets } from "./useCubeAssets";

/** Euler rotation that turns the sticker plane to face each outward normal. */
const NORMAL_ROTATION: Record<string, readonly [number, number, number]> = {
  "0,0,1": [0, 0, 0],
  "0,0,-1": [0, Math.PI, 0],
  "1,0,0": [0, Math.PI / 2, 0],
  "-1,0,0": [0, -Math.PI / 2, 0],
  "0,1,0": [-Math.PI / 2, 0, 0],
  "0,-1,0": [Math.PI / 2, 0, 0],
};

interface CubieProps {
  cubie: Cubie;
  assets: CubeAssets;
  groupRef: Ref<THREE.Group>;
}

/**
 * Visual body of one cubie: a rounded black box plus a sticker per outward
 * face of its solved position. The group transform is driven imperatively by
 * `CubeRig`, so nothing here changes during animation.
 */
export function CubieMesh({ cubie, assets, groupRef }: CubieProps) {
  return (
    <group ref={groupRef}>
      <mesh geometry={assets.bodyGeometry} material={assets.bodyMaterial} />
      {stickerNormals(cubie.home).map((normal) => {
        const face = faceForNormal(normal);
        if (!face) return null;
        const key = normal.join(",");
        return (
          <mesh
            key={key}
            geometry={assets.stickerGeometry}
            material={assets.stickerMaterials[face]}
            position={[
              normal[0] * STICKER_OFFSET,
              normal[1] * STICKER_OFFSET,
              normal[2] * STICKER_OFFSET,
            ]}
            rotation={NORMAL_ROTATION[key]}
          />
        );
      })}
    </group>
  );
}
