"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  isInLayer,
  moveAxis,
  moveQuarters,
  type Axis,
  type CubeState,
  type Mat3,
} from "@/lib/cube";
import { clamp01, easeInOutCubic, easeOutCubic } from "@/lib/easing";
import type { QueuedMove } from "@/store/game";
import { CubieMesh } from "./CubieMesh";
import { useCubeAssets } from "./useCubeAssets";

/** One-off "assembly" animation when the scene first appears. */
const INTRO_MS = 900;
const INTRO_DISTANCE = 2.6;

// `frameloop="demand"` only runs `clock.getDelta()` on rendered frames, so the
// first frame after an idle gap reports the whole gap as `delta`. Clamp the
// per-frame step so a turn always plays out instead of snapping to its end.
const MAX_STEP_MS = 34;

const AXIS_VECTOR: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};

function setQuaternionFromMat3(
  out: THREE.Quaternion,
  rot: Mat3,
  matrix: THREE.Matrix4,
): void {
  matrix.set(
    rot[0], rot[1], rot[2], 0,
    rot[3], rot[4], rot[5], 0,
    rot[6], rot[7], rot[8], 0,
    0, 0, 0, 1,
  );
  out.setFromRotationMatrix(matrix);
}

interface CubeRigProps {
  cubies: CubeState;
  /** Turn being animated, or null when idle. */
  active: QueuedMove | null;
  /** Resolved duration of the active turn in milliseconds. */
  durationMs: number;
  /** Reflection map shared by every material, once the studio is rendered. */
  environment: THREE.CubeTexture | null;
  /** Play the one-off assembly animation. */
  intro: boolean;
  /** Called when the active turn finished, to commit it to the store. */
  onTurnComplete: () => void;
  /** Called once, when the assembly animation (or its absence) is done. */
  onIntroComplete?: () => void;
}

/**
 * Owns every cubie transform. All 27 groups are updated imperatively inside a
 * single `useFrame` so React never re-renders per animation frame, and the
 * canvas only redraws while something is actually moving.
 */
export function CubeRig({
  cubies,
  active,
  durationMs,
  environment,
  intro,
  onTurnComplete,
  onIntroComplete,
}: CubeRigProps) {
  const assets = useCubeAssets(environment);
  const invalidate = useThree((state) => state.invalidate);
  const rootRef = useRef<THREE.Group>(null);
  const groupsRef = useRef(new Map<string, THREE.Group>());

  const turnRef = useRef<{ elapsed: number; active: QueuedMove | null; duration: number }>({
    elapsed: 0,
    active: null,
    duration: durationMs,
  });
  const introRef = useRef(intro ? 0 : 1);
  const introDoneRef = useRef(!intro);
  const completeRef = useRef(onTurnComplete);
  const introCompleteRef = useRef(onIntroComplete);

  useEffect(() => {
    completeRef.current = onTurnComplete;
  }, [onTurnComplete]);

  useEffect(() => {
    introCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);

  const scratch = useMemo(
    () => ({
      quaternion: new THREE.Quaternion(),
      matrix: new THREE.Matrix4(),
      turnQuaternion: new THREE.Quaternion(),
      position: new THREE.Vector3(),
      drift: new THREE.Vector3(),
    }),
    [],
  );

  useEffect(() => {
    turnRef.current.elapsed = 0;
    turnRef.current.active = active;
    turnRef.current.duration = durationMs;
    invalidate();
  }, [active, durationMs, invalidate]);

  useFrame((_, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const dtMs = Math.min(delta * 1000, MAX_STEP_MS);
    const introStep = introRef.current === 1 ? 1 : clamp01(introRef.current + dtMs / INTRO_MS);
    introRef.current = introStep;
    const introProgress = easeOutCubic(introStep);

    const turn = turnRef.current;
    let turnProgress = 0;
    if (turn.active) {
      turn.elapsed += dtMs;
      turnProgress = turn.duration > 0 ? clamp01(turn.elapsed / turn.duration) : 1;
    }
    const easedTurn = easeInOutCubic(turnProgress);
    const turning = turn.active;

    for (const cubie of cubies) {
      const group = groupsRef.current.get(cubie.id);
      if (!group) continue;

      setQuaternionFromMat3(scratch.quaternion, cubie.rot, scratch.matrix);
      scratch.position.set(cubie.pos[0], cubie.pos[1], cubie.pos[2]);
      group.quaternion.copy(scratch.quaternion);

      if (turning && easedTurn > 0 && isInLayer(cubie, turning.move)) {
        const axis = AXIS_VECTOR[moveAxis(turning.move)];
        scratch.turnQuaternion.setFromAxisAngle(
          axis,
          moveQuarters(turning.move) * (Math.PI / 2) * easedTurn,
        );
        scratch.position.applyQuaternion(scratch.turnQuaternion);
        group.quaternion.premultiply(scratch.turnQuaternion);
      }

      if (introProgress < 1) {
        scratch.drift
          .set(cubie.home[0], cubie.home[1], cubie.home[2])
          .multiplyScalar((1 - introProgress) * INTRO_DISTANCE);
        scratch.position.add(scratch.drift);
      }

      group.position.copy(scratch.position);
    }

    root.scale.setScalar(0.94 + 0.06 * introProgress);

    const turnFinished = turning !== null && turnProgress >= 1;
    if (turnFinished) {
      turn.active = null;
      completeRef.current();
    }
    if (!introDoneRef.current && introStep >= 1) {
      introDoneRef.current = true;
      introCompleteRef.current?.();
    }
    if (introStep < 1 || (turning !== null && !turnFinished)) invalidate();
  });

  return (
    <group ref={rootRef}>
      {cubies.map((cubie) => (
        <CubieMesh
          key={cubie.id}
          cubie={cubie}
          assets={assets}
          groupRef={(node) => {
            if (node) groupsRef.current.set(cubie.id, node);
            else groupsRef.current.delete(cubie.id);
          }}
        />
      ))}
    </group>
  );
}
