import type { Patch } from "@vfxcopilot/shared";

export interface Checkpoint {
  id: string;
  timestamp: number;
  effectName: string;
  patch: Patch;
  createdPaths: string[];
}

export interface CLIState {
  status: "idle" | "generating" | "error";
  currentPatch: Patch | null;
  checkpoints: Checkpoint[];
  lastError: string | null;
}

type Listener = (state: Readonly<CLIState>) => void;

class Store {
  private state: CLIState = {
    status: "idle",
    currentPatch: null,
    checkpoints: [],
    lastError: null,
  };

  private listeners: Listener[] = [];

  getState(): Readonly<CLIState> {
    return this.state;
  }

  update(partial: Partial<CLIState>): void {
    this.state = { ...this.state, ...partial };
    for (const fn of this.listeners) fn(this.state);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
}

export const store = new Store();
