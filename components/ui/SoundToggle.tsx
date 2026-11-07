"use client";

import { useT } from "@/hooks/useT";
import { useGameStore } from "@/store/game";
import { Button } from "./Button";

/** Speaker with sound waves, or a slash across it when muted. */
function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4">
      <path
        d="M3 7.5h3l4-3.2v11.4L6 12.5H3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M12.5 7.5 17 12.5M17 7.5 12.5 12.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <>
          <path
            d="M12.5 7.4a3.4 3.4 0 0 1 0 5.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14.6 5.1a6.6 6.6 0 0 1 0 9.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/** Mute switch for the turn and win sound effects. */
export function SoundToggle() {
  const t = useT();
  const soundOn = useGameStore((state) => state.soundOn);
  const toggleSound = useGameStore((state) => state.toggleSound);

  return (
    <Button
      variant="outline"
      size="icon"
      className="shrink-0"
      role="switch"
      aria-checked={soundOn}
      aria-label={t("sound.aria")}
      title={soundOn ? t("sound.mute") : t("sound.unmute")}
      onClick={toggleSound}
    >
      <SpeakerIcon muted={!soundOn} />
    </Button>
  );
}
