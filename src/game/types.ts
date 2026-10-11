export type Phase = "menu" | "playing" | "paused" | "dying" | "over";

export type Hud = {
  phase: Phase;
  score: number;
  height: number;
  wishes: number;
  lives: number;
  combo: number;
  shield: boolean;
  bestScore: number;
  bestHeight: number;
  muted: boolean;
  shake: boolean;
  newBest: boolean;
  hint: boolean;
};

export type ControlsProbe = {
  getX: () => number;
  getYaw: () => number;
  getSpeed: () => number;
  setKeys: (codes: string[]) => void;
  getPhase: () => Phase;
};

declare global {
  interface Window {
    __controlsTest?: ControlsProbe;
  }
}
