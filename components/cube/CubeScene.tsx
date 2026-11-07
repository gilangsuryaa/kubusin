"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { useResolvedTheme } from "@/hooks/useTheme";
import { registerCameraNudge } from "@/lib/cameraBus";
import { MOVE_DURATION_MS, moveDuration, useGameStore } from "@/store/game";
import { CubeRig } from "./CubeRig";
import { OrientationGroup } from "./OrientationGroup";
import { useStudioEnvironment } from "./useStudioEnvironment";

const FOV = 34;
const CAMERA_POSITION: [number, number, number] = [4.7, 3.5, 5.4];
const CAMERA_DISTANCE = Math.hypot(...CAMERA_POSITION);
/** Half-size of the cube including its stickers, used to keep it on screen. */
const FIT_RADIUS = 2.25;
const MIN_DISTANCE = 5.2;
const MAX_DISTANCE = 14;

/**
 * Scales the whole rig so the cube always fits an arbitrarily narrow viewport
 * without touching the camera, which keeps OrbitControls untouched.
 */
function FitScale({ children }: { children: ReactNode }) {
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  const scale = useMemo(() => {
    const aspect = width / Math.max(1, height);
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAMERA_DISTANCE;
    const halfWidth = halfHeight * aspect;
    const fitted = Math.min(1, halfWidth / FIT_RADIUS, halfHeight / FIT_RADIUS);
    return THREE.MathUtils.clamp(fitted, 0.45, 1);
  }, [width, height]);

  return <group scale={scale}>{children}</group>;
}

interface OrbitLike {
  object: THREE.Camera;
  target: THREE.Vector3;
  update: () => void;
}

/** Lets arrow keys orbit the camera through the shared camera bus. */
function CameraNudgeBridge() {
  const controls = useThree((state) => state.controls) as unknown as OrbitLike | null;
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    if (!controls) return;
    const offset = new THREE.Vector3();
    const spherical = new THREE.Spherical();
    return registerCameraNudge((deltaAzimuth, deltaPolar) => {
      offset.copy(controls.object.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.theta += deltaAzimuth;
      spherical.phi = THREE.MathUtils.clamp(
        spherical.phi + deltaPolar,
        0.2,
        Math.PI - 0.2,
      );
      offset.setFromSpherical(spherical);
      controls.object.position.copy(controls.target).add(offset);
      controls.object.lookAt(controls.target);
      controls.object.updateMatrixWorld();
      controls.update();
      invalidate();
    });
  }, [controls, invalidate]);

  return null;
}

/**
 * Three studio lights: one warm key from above front, one cool fill, and a low
 * bounce. The reflection map adds the sheen on top of these.
 */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#fff6ea", "#201c18", 0.28]} />
      <directionalLight position={[6, 9, 5]} intensity={0.85} />
      <directionalLight position={[-7, 3, -4]} intensity={0.3} />
      <directionalLight position={[2, -6, 3]} intensity={0.12} />
    </>
  );
}

interface CubeContentProps {
  onIntroComplete: () => void;
}

/**
 * Everything that needs the WebGL context, kept inside `<Canvas>` so the R3F
 * hooks (the studio reflection map in particular) have their provider.
 */
function CubeContent({ onIntroComplete }: CubeContentProps) {
  const cubies = useGameStore((state) => state.cubies);
  const active = useGameStore((state) => state.active);
  const commitActive = useGameStore((state) => state.commitActive);
  const orientation = useGameStore((state) => state.orientation);
  const reducedMotion = usePrefersReducedMotion();
  const dark = useResolvedTheme() === "dark";
  const replaying = useGameStore((state) => state.replayingId !== null);
  const environment = useStudioEnvironment();
  const invalidate = useThree((state) => state.invalidate);

  // Theme changes recolor the ground shadow; demand mode needs a nudge to paint.
  useEffect(() => {
    invalidate();
  }, [dark, invalidate]);

  const durationMs = active
    ? moveDuration(active.source, reducedMotion, replaying)
    : MOVE_DURATION_MS;

  return (
    <FitScale>
      <OrientationGroup orientation={orientation}>
        <CubeRig
          cubies={cubies}
          active={active}
          durationMs={durationMs}
          environment={environment}
          intro={!reducedMotion}
          onTurnComplete={commitActive}
          onIntroComplete={onIntroComplete}
        />
      </OrientationGroup>
      <ContactShadows
        position={[0, -1.72, 0]}
        scale={9}
        far={4.2}
        blur={2.6}
        resolution={512}
        frames={Infinity}
        opacity={dark ? 0.9 : 0.42}
        color={dark ? "#f4f2ed" : "#1b1712"}
      />
    </FitScale>
  );
}

interface CubeSceneProps {
  onIntroComplete: () => void;
}

export default function CubeScene({ onIntroComplete }: CubeSceneProps) {
  return (
    <Canvas
      frameloop="demand"
      flat
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: CAMERA_POSITION, fov: FOV, near: 0.1, far: 80 }}
      style={{ touchAction: "none" }}
      aria-hidden="true"
    >
      <Lights />
      <CubeContent onIntroComplete={onIntroComplete} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.85}
        zoomSpeed={0.7}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        target={[0, 0, 0]}
      />
      <CameraNudgeBridge />
    </Canvas>
  );
}
