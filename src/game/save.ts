export type SaveData = {
  version: 1;
  bestScore: number;
  bestHeight: number;
  muted: boolean;
  shake: boolean | null;
};

const KEY = "hikari-save-v1";

const empty: SaveData = {
  version: 1,
  bestScore: 0,
  bestHeight: 0,
  muted: false,
  shake: null,
};

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.version !== 1) return { ...empty };
    return {
      version: 1,
      bestScore: typeof parsed.bestScore === "number" ? parsed.bestScore : 0,
      bestHeight: typeof parsed.bestHeight === "number" ? parsed.bestHeight : 0,
      muted: parsed.muted === true,
      shake: typeof parsed.shake === "boolean" ? parsed.shake : null,
    };
  } catch {
    return { ...empty };
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota — the run still plays */
  }
}
