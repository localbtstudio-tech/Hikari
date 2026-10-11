import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  MoveHorizontal,
  Pause,
  Play,
  Sparkles,
  Spline,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
} from "lucide-react";
import { createGame, type GameHandle } from "@/game/engine";
import type { Hud } from "@/game/types";

const initialHud: Hud = {
  phase: "menu",
  score: 0,
  height: 0,
  wishes: 0,
  lives: 3,
  combo: 0,
  shield: false,
  bestScore: 0,
  bestHeight: 0,
  muted: false,
  shake: true,
  newBest: false,
  hint: false,
};

function fmt(n: number) {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function HikariApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const [hud, setHud] = useState<Hud>(initialHud);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = createGame(canvas, setHud);
    gameRef.current = game;
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const bestLine =
    hud.bestScore > 0
      ? `Best ${fmt(hud.bestScore)} · ${fmt(hud.bestHeight)} m`
      : "No ascent yet";

  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-ink text-paper">
      {hud.phase !== "menu" && <h1 className="sr-only">Hikari</h1>}
      <div className="stage-frame relative overflow-hidden bg-ink touch-none">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {hud.phase === "menu" && (
          <div className="absolute inset-0 flex flex-col">
            <div className="flex items-center justify-between p-4">
              <p className="text-xs font-medium tracking-widest text-mist uppercase">
                A lantern ascent
              </p>
              <Toggles hud={hud} gameRef={gameRef} />
            </div>
            <div className="scrim-bottom mt-auto flex flex-col gap-4 px-5 pt-16 pb-6">
              <div className="rise-in">
                <h1 className="title-fit font-display text-paper italic">Hikari</h1>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-pretty text-paper-dim">
                  Steer a paper lantern through silk, wire, and falling sparks.
                  Thread the gaps. Keep the flame.
                </p>
              </div>
              <ul className="compact-hide flex flex-col gap-2 text-sm">
                <li className="flex items-center gap-3">
                  <MoveHorizontal className="size-5 shrink-0 text-gold" aria-hidden="true" />
                  <span>A and D, arrows, or a finger</span>
                </li>
                <li className="flex items-center gap-3">
                  <Spline className="size-5 shrink-0 text-gold" aria-hidden="true" />
                  <span>Thread close for a higher call</span>
                </li>
                <li className="flex items-center gap-3">
                  <Sparkles className="size-5 shrink-0 text-gold" aria-hidden="true" />
                  <span>Wishes build the combo</span>
                </li>
              </ul>
              <button
                type="button"
                className="h-12 rounded-full bg-seal text-base font-semibold text-paper"
                onClick={() => gameRef.current?.start()}
              >
                Start ascent
              </button>
              <p className="text-center text-xs text-mist tabular-nums">{bestLine}</p>
            </div>
          </div>
        )}

        {(hud.phase === "playing" || hud.phase === "dying") && (
          <>
            <div className="scrim-top pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <div>
                <p className="font-display text-4xl leading-none text-paper tabular-nums">
                  {fmt(hud.height)}
                  <span className="ml-1 font-sans text-sm font-medium text-mist">m</span>
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="flex gap-1" aria-label={`${hud.lives} flames`}>
                    {[0, 1, 2].map((i) => (
                      <Flame
                        key={i}
                        className={
                          i < hud.lives
                            ? "size-5 fill-gold text-gold"
                            : "size-5 text-mist"
                        }
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-gold-soft tabular-nums">
                    <Sparkles className="size-4" aria-hidden="true" />
                    {hud.wishes}
                  </span>
                  {hud.shield && (
                    <span className="text-xs font-medium tracking-wide text-gold uppercase">
                      Ward
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-mist tabular-nums">{fmt(hud.score)}</p>
              </div>
              <button
                type="button"
                className="pointer-events-auto grid size-11 place-items-center rounded-full border border-paper-dim bg-ink-soft text-paper"
                aria-label="Pause"
                onClick={() => gameRef.current?.pause()}
                disabled={hud.phase !== "playing"}
              >
                <Pause className="size-5" aria-hidden="true" />
              </button>
            </div>
            {hud.combo >= 2 && hud.phase === "playing" && (
              <p className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 font-display text-2xl text-gold tabular-nums">
                ×{hud.combo}
              </p>
            )}
            {hud.hint && (
              <div className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-between px-3 text-mist">
                <ChevronLeft className="size-6" aria-hidden="true" />
                <p className="text-xs tracking-wide">Drag, or hold A and D</p>
                <ChevronRight className="size-6" aria-hidden="true" />
              </div>
            )}
          </>
        )}

        {hud.phase === "paused" && (
          <div className="absolute inset-0 grid place-items-center bg-ink/70 p-5">
            <div className="rise-in w-full max-w-xs rounded-card bg-paper p-6 text-ink">
              <h2 className="font-display text-4xl italic leading-none">Paused</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                The lantern waits. {fmt(hud.height)} m · {fmt(hud.score)}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-seal text-base font-semibold text-paper"
                  onClick={() => gameRef.current?.resume()}
                >
                  <Play className="size-4" aria-hidden="true" />
                  Resume
                </button>
                <button
                  type="button"
                  className="h-12 rounded-full border border-ink text-base font-medium text-ink"
                  onClick={() => gameRef.current?.toMenu()}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}

        {hud.phase === "over" && (
          <div className="scrim-bottom absolute inset-0 flex flex-col justify-end px-5 pt-16 pb-6">
            <div className="rise-in">
              <h2 className="title-fit font-display text-paper italic">The flame goes out</h2>
              <p className="mt-3 text-sm text-paper-dim">
                {hud.newBest ? "A new best." : bestLine}
              </p>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat label="Height" value={`${fmt(hud.height)} m`} />
              <Stat label="Wishes" value={fmt(hud.wishes)} />
              <Stat label="Score" value={fmt(hud.score)} />
            </dl>
            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                className="h-12 rounded-full bg-seal text-base font-semibold text-paper"
                onClick={() => gameRef.current?.restart()}
              >
                Rise again
              </button>
              <button
                type="button"
                className="h-12 rounded-full border border-paper-dim text-base font-medium text-paper"
                onClick={() => gameRef.current?.toMenu()}
              >
                Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-soft px-2 py-3">
      <dt className="text-xs tracking-wide text-mist uppercase">{label}</dt>
      <dd className="mt-1 font-display text-xl text-paper tabular-nums">{value}</dd>
    </div>
  );
}

function Toggles({
  hud,
  gameRef,
}: {
  hud: Hud;
  gameRef: RefObject<GameHandle | null>;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full bg-ink-soft text-paper"
        aria-label={hud.muted ? "Unmute" : "Mute"}
        aria-pressed={hud.muted}
        onClick={() => gameRef.current?.toggleMute()}
      >
        {hud.muted ? (
          <VolumeX className="size-5" aria-hidden="true" />
        ) : (
          <Volume2 className="size-5" aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        className="grid size-11 place-items-center rounded-full bg-ink-soft text-paper"
        aria-label={hud.shake ? "Turn shake off" : "Turn shake on"}
        aria-pressed={hud.shake}
        onClick={() => gameRef.current?.toggleShake()}
      >
        {hud.shake ? (
          <Vibrate className="size-5" aria-hidden="true" />
        ) : (
          <VibrateOff className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
