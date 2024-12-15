import { SDK } from "caido:plugin";

export class DiffingSystem {
  private initialDiffCount: number;
  private sdk: SDK;

  constructor(sdk: SDK, private input1: string, private input2: string) {
    this.sdk = sdk;

    const linesA = this.input1.split(/\r?\n/);
    const linesB = this.input2.split(/\r?\n/);

    this.initialDiffCount = this.countDifferences(linesA, linesB);
  }

  public hasChanges(input: string): boolean {
    const lines = input.split(/\r?\n/);
    const linesA = this.input1.split(/\r?\n/);

    const diffCount = this.countDifferences(linesA, lines);

    if (diffCount !== this.initialDiffCount) {
      this.sdk.console.log(`Difference count changed from ${this.initialDiffCount} to ${diffCount}`);
      return true;
    }
    return false;
  }

  private countDifferences(linesA: string[], linesB: string[]): number {
    const maxLines = Math.max(linesA.length, linesB.length);
    let differences = 0;

    for (let i = 0; i < maxLines; i++) {
      const a = linesA[i] ?? "";
      const b = linesB[i] ?? "";
      if (a !== b) {
        differences++;
      }
    }

    return differences;
  }
}
