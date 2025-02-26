import { SDK } from "caido:plugin";
import { Wordlist, AttackType } from "shared";
import { Database } from "sqlite";
import { deleteFile } from "../util/helper";
import { BackendSDK } from "../types/types";

// Define the current schema version
const CURRENT_SCHEMA_VERSION = 2;

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

    // Check if the schema_version table exists
    const versionTableExistsStatement = await this.database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    );
    const versionTableExists = await versionTableExistsStatement.get();

    // Create schema_version table if it doesn't exist
    if (!versionTableExists) {
      await this.database.exec(`
        CREATE TABLE schema_version (
          version INTEGER PRIMARY KEY,
          updated_at TEXT
        )
      `);
      // Insert initial version (1 for pre-migration state)
      await this.database.exec(`
        INSERT INTO schema_version (version, updated_at)
        VALUES (1, datetime('now'))
      `);
    }

    // Check if the wordlists table exists
    const tableExistsStatement = await this.database.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='wordlists'"
    );
    const tableExists = await tableExistsStatement.get();

    // Create wordlists table if it doesn't exist
    if (!tableExists) {
      await this.database.exec(`
        CREATE TABLE wordlists (
          path TEXT PRIMARY KEY,
          attack_types TEXT,
          enabled INTEGER DEFAULT 1
        )
      `);

      // Set schema version to current if creating a new table
      await this.updateSchemaVersion(CURRENT_SCHEMA_VERSION);
      return true;
    }

    // Run migrations if needed
    await this.runMigrations();
    return false;
  }

  private async getCurrentSchemaVersion(): Promise<number> {
    if (!this.database) throw new Error("Database not initialized");

    const statement = await this.database.prepare(
      "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"
    );
    const result = await statement.get();
    return result ? (result as { version: number }).version : 0;
  }

  private async updateSchemaVersion(version: number): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    await this.database.exec(`
      INSERT INTO schema_version (version, updated_at)
      VALUES (${version}, datetime('now'))
    `);

    this.sdk.console.log(`[DATABASE] Updated schema version to ${version}`);
  }

  private async runMigrations(): Promise<void> {
    const currentVersion = await this.getCurrentSchemaVersion();

    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      this.sdk.console.log(`[DATABASE] Running migrations from version ${currentVersion} to ${CURRENT_SCHEMA_VERSION}`);

      // Migration from version 1 to 2: Add attack_types column
      if (currentVersion < 2) {
        await this.migrateToV2();
      }

      await this.updateSchemaVersion(CURRENT_SCHEMA_VERSION);
    }
  }

  private async migrateToV2(): Promise<void> {
    if (!this.database) throw new Error("Database not initialized");

    this.sdk.console.log("[DATABASE] Running migration to v2: Adding attack_types column");

    try {
      // Check if attack_types column exists
      const columnInfoStatement = await this.database.prepare("PRAGMA table_info(wordlists)");
      const columns = await columnInfoStatement.all() as Array<{ name: string }>;
      const hasAttackTypesColumn = columns.some(col => col.name === 'attack_types');

      if (!hasAttackTypesColumn) {
        // Add attack_types column with default value
        await this.database.exec(`
          ALTER TABLE wordlists ADD COLUMN attack_types TEXT DEFAULT 'body,headers,query'
        `);
        this.sdk.console.log("[DATABASE] Added attack_types column with default values");
      } else {
        this.sdk.console.log("[DATABASE] attack_types column already exists, skipping");
      }
    } catch (error) {
      this.sdk.console.log(`[DATABASE] Migration error: ${error}`);
      throw error;
    }
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
      attackTypes: (row.attack_types || "body,headers,query").split(",") as AttackType[],
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
