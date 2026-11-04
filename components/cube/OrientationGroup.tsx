"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { orientationRotation, type CubeOrientation } from "@/lib/cube";

/** Rough settle time for the reorientation swing. */
const TRANSITION_MS = 240;
const MAX_STEP_MS = 34;
/** Below this angle the swing is visually done; snap the rest. */
const SETTLE_RAD = 0.012;

function quaternionForOrientation(orientation: CubeOrientation): THREE.Quaternion {
  const r = orientationRotation(orientation.front, orientation.up);
  const matrix = new THREE.Matrix4().set(
    r[0], r[1], r[2], 0,
    r[3], r[4], r[5], 0,
    r[6], r[7], r[8], 0,
    0, 0, 0, 1,
  );
  return new THREE.Quaternion().setFromRotationMatrix(matrix);
}

/**
 * Rotates the whole rig so the player's chosen front and up colours line up
 * with the canonical view. The swing is animated, but frame-stepped like
 * `CubeRig` so a big `delta` after an idle gap (demand frameloop) cannot make
 * it snap. Reduced motion collapses it to an instant change.
 */
export function OrientationGroup({
  orientation,
  children,
}: {
  orientation: CubeOrientation;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree((state) => state.invalidate);
  const reducedMotion = usePrefersReducedMotion();
  const target = useMemo(
    () => quaternionForOrientation(orientation),
    [orientation],
  );
  const settled = useRef(false);

  useEffect(() => {
    settled.current = false;
    invalidate();
  }, [target, invalidate]);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group || settled.current) return;
    if (reducedMotion) {
      group.quaternion.copy(target);
      settled.current = true;
      return;
    }
    const dt = Math.min(delta * 1000, MAX_STEP_MS);
    group.quaternion.slerp(target, 1 - Math.exp(-dt / (TRANSITION_MS / 3)));
    if (group.quaternion.angleTo(target) < SETTLE_RAD) {
      group.quaternion.copy(target);
      settled.current = true;
      return;
    }
    invalidate();
  });

  return <group ref={ref}>{children}</group>;
}
