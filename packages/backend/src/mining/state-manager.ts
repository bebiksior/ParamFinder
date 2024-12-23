import { MiningSessionPhase, MiningSessionState } from "shared";
import { EventEmitter } from "events";

export type StateChangeEvent = {
  oldState: MiningSessionState;
  newState: MiningSessionState;
  phase?: MiningSessionPhase;
};

export class StateManager {
  private state: MiningSessionState;
  private phase: MiningSessionPhase;
  private readonly eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.state = MiningSessionState.Pending;
    this.phase = MiningSessionPhase.Idle;
    this.eventEmitter = eventEmitter;
  }

  public getState(): Readonly<MiningSessionState> {
    return this.state;
  }

  public getPhase(): Readonly<MiningSessionPhase> {
    return this.phase;
  }

  private async waitForStateChange(): Promise<void> {
    while (this.isPaused()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  public async continueOrWait(): Promise<boolean> {
    if (!this.shouldContinue()) {
      return false;
    }

    if (this.isPaused()) {
      await this.waitForStateChange();
      return this.shouldContinue();
    }

    return true;
  }

  public updateState(
    newState: MiningSessionState,
    phase?: MiningSessionPhase,
  ): void {
    const oldState = this.state;
    this.state = newState;

    if (phase) {
      this.phase = phase;
    }

    const event: StateChangeEvent = { oldState, newState, phase };
    this.eventEmitter.emit("stateChange", newState, phase);
    this.eventEmitter.emit("debug", this.formatStateChangeMessage(event));
  }

  private formatStateChangeMessage({
    oldState,
    newState,
    phase,
  }: StateChangeEvent): string {
    return `[state-manager.ts] State changed from ${oldState} to ${newState}${phase ? ` (${phase})` : ""}`;
  }

  public pause(): void {
    if (this.isRunningOrLearning()) {
      this.updateState(MiningSessionState.Paused);
    }
  }

  public resume(): void {
    if (this.isPaused()) {
      const newState =
        this.phase === MiningSessionPhase.Learning
          ? MiningSessionState.Learning
          : MiningSessionState.Running;
      this.updateState(newState);
    }
  }

  public cancel(): void {
    this.updateState(MiningSessionState.Canceled);
  }

  public shouldContinue(): boolean {
    return !this.isCanceledOrError();
  }

  public isActive(): boolean {
    return this.isRunningOrLearning() || this.isPaused();
  }

  private isPaused(): boolean {
    return this.state === MiningSessionState.Paused;
  }

  private isRunningOrLearning(): boolean {
    return (
      this.state === MiningSessionState.Running ||
      this.state === MiningSessionState.Learning
    );
  }

  private isCanceledOrError(): boolean {
    return (
      this.state === MiningSessionState.Canceled ||
      this.state === MiningSessionState.Error
    );
  }
}
