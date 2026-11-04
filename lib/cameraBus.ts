/**
 * Tiny bus so keyboard input can nudge the 3D camera without threading
 * callbacks through the React tree. The scene registers a handler while it is
 * mounted; the keyboard hook publishes deltas in radians.
 */
export type CameraNudge = (deltaAzimuth: number, deltaPolar: number) => void;

const handlers = new Set<CameraNudge>();

export function registerCameraNudge(handler: CameraNudge): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function nudgeCamera(deltaAzimuth: number, deltaPolar: number): void {
  for (const handler of handlers) handler(deltaAzimuth, deltaPolar);
}

export function hasCameraHandler(): boolean {
  return handlers.size > 0;
}

/** Radians moved per arrow key press. */
export const CAMERA_STEP = Math.PI / 18;
