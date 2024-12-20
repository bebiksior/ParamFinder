import { MiningSessionState } from "shared";
import { EventEmitter } from "events";

export class StateManager {
  private state: MiningSessionState;
  private phase: "learning" | "discovery" | "idle";
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.state = MiningSessionState.Pending;
    this.phase = "idle";
    this.eventEmitter = eventEmitter;
  }

  public getState(): MiningSessionState {
    return this.state;
  }

  public getPhase(): "learning" | "discovery" | "idle" {
    return this.phase;
  }

  private async waitForStateChange(): Promise<void> {
    while (this.state === MiningSessionState.Paused) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  public async continueOrWait(): Promise<boolean> {
    if (!this.shouldContinue()) {
      return false;
    }

    if (this.state === MiningSessionState.Paused) {
      await this.waitForStateChange();
      return this.shouldContinue();
    }

    return true;
  }

  public updateState(newState: MiningSessionState, phase?: "learning" | "discovery" | "idle"): void {
    const oldState = this.state;
    this.state = newState;

    if (phase) {
      this.phase = phase;
    }

    this.eventEmitter.emit("stateChange", newState);
    this.eventEmitter.emit("debug", `[state-manager.ts] State changed from ${oldState} to ${newState}${phase ? ` (${phase})` : ''}`);
  }

  public pause(): void {
    if (this.state === MiningSessionState.Running || this.state === MiningSessionState.Learning) {
      this.updateState(MiningSessionState.Paused);
    }
  }

  public resume(): void {
    if (this.state === MiningSessionState.Paused) {
      const newState = this.phase === "learning" ? MiningSessionState.Learning : MiningSessionState.Running;
      this.updateState(newState);
    }
  }

  public cancel(): void {
    this.updateState(MiningSessionState.Canceled);
  }

  public shouldContinue(): boolean {
    return this.state !== MiningSessionState.Canceled && this.state !== MiningSessionState.Error;
  }

  public isActive(): boolean {
    return this.state === MiningSessionState.Running ||
           this.state === MiningSessionState.Learning ||
           this.state === MiningSessionState.Paused;
  }
}
