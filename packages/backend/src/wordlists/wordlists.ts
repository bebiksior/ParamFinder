import { SDK } from "caido:plugin";
import { Wordlist, AttackType } from "shared";
import { Database } from "sqlite";
import { deleteFile } from "../util/helper";
import { BackendSDK } from "../types/types";

class WordlistManager {
  private sdk: SDK;
  private database: Database | null = null;

  constructor(sdk: SDK) {
    this.sdk = sdk;
    this.init();
  }

  private async init(): Promise<boolean> {
    this.database = await this.sdk.meta.db();
    return await this.setupDatabase();
  }

  private async setupDatabase(): Promise<boolean> {
    if (!this.database) return false;

    const tableExistsStatement = await this.database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='wordlists'",
    );
    const tableExists = await tableExistsStatement.get();

    if (tableExists) {
      return false;
    }

    await this.database.exec(`
      CREATE TABLE wordlists (
        path TEXT PRIMARY KEY,
        attack_types TEXT,
        enabled INTEGER DEFAULT 1
      )
    `);

    return true;
  }

  async addWordlistPath(path: string, enabled: boolean = true, attackTypes: AttackType[] = ["body", "headers", "query"]): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    const startTime = Date.now();
    const statement = await this.database.prepare(
      "INSERT OR IGNORE INTO wordlists (path, enabled, attack_types) VALUES (?, ?, ?)",
    );
    await statement.run(path, enabled ? 1 : 0, attackTypes.join(","));

    const timeTaken = Date.now() - startTime;
    this.sdk.console.log(`[DATABASE] Added wordlist path in ${timeTaken}ms`);
  }

  async removeWordlistPath(path: string): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    const startTime = Date.now();
    const statement = await this.database.prepare(
      "DELETE FROM wordlists WHERE path = ?",
    );
    await statement.run(path);

    this.sdk.console.log(`[DATABASE] Removing wordlist path ${path}`);
    await deleteFile(this.sdk, path);

    const timeTaken = Date.now() - startTime;
    this.sdk.console.log(`[DATABASE] Removed wordlist path in ${timeTaken}ms`);
  }

  async getWordlists(): Promise<Wordlist[]> {
    if (!this.database) throw new Error("Database not initialized");

    const startTime = Date.now();
    const statement = await this.database.prepare(
      "SELECT path, enabled, attack_types FROM wordlists",
    );
    const rows = (await statement.all()) as Array<{
      path: string;
      enabled: number;
      attack_types: string;
    }>;

    const timeTaken = Date.now() - startTime;
    this.sdk.console.log(`[DATABASE] Fetched wordlist paths in ${timeTaken}ms`);

    return rows.map((row) => ({
      path: row.path,
      enabled: Boolean(row.enabled),
      attackTypes: row.attack_types.split(",") as AttackType[],
    }));
  }

  async toggleWordlist(path: string, enabled: boolean): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    const startTime = Date.now();
    const statement = await this.database.prepare(
      "UPDATE wordlists SET enabled = ? WHERE path = ?",
    );
    await statement.run(enabled ? 1 : 0, path);

    const timeTaken = Date.now() - startTime;
    this.sdk.console.log(`[DATABASE] Toggled wordlist in ${timeTaken}ms`);
  }

  async clearWordlists(): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    const wordlists = await this.getWordlists();
    for (const { path } of wordlists) {
      await deleteFile(this.sdk, path);
    }

    const startTime = Date.now();
    const statement = await this.database.prepare("DELETE FROM wordlists");
    await statement.run();

    const timeTaken = Date.now() - startTime;
    this.sdk.console.log(`[DATABASE] Cleared wordlists in ${timeTaken}ms`);
  }

  async updateAttackTypes(path: string, attackTypes: AttackType[]): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    const startTime = Date.now();
    const statement = await this.database.prepare(
      "UPDATE wordlists SET attack_types = ? WHERE path = ?",
    );
    await statement.run(attackTypes.join(","), path);

    const timeTaken = Date.now() - startTime;
    this.sdk.console.log(`[DATABASE] Updated attack types in ${timeTaken}ms`);
  }
}

let wordlistManager: WordlistManager | null = null;

export function initWordlistManager(sdk: BackendSDK) {
  if (wordlistManager) {
    throw new Error("Wordlist manager already initialized");
  }

  wordlistManager = new WordlistManager(sdk);
}

export function getWordlistManager(): WordlistManager {
  if (!wordlistManager) {
    throw new Error("Wordlist manager not initialized");
  }
  return wordlistManager;
}
