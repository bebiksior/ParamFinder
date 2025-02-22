import { error, ok, Result, Wordlist, AttackType } from "shared";
import { BackendSDK } from "../types/types";
import { getWordlistManager } from "../wordlists/wordlists";
import { writeToFile } from "../util/helper";

export async function addWordlistPath(
  sdk: BackendSDK,
  path: string,
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.addWordlistPath(path);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function removeWordlistPath(
  sdk: BackendSDK,
  path: string,
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.removeWordlistPath(path);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function getWordlists(
  sdk: BackendSDK,
): Promise<Result<Wordlist[]>> {
  const wordlistManager = getWordlistManager();

  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    const wordlists = await wordlistManager.getWordlists();
    return ok(wordlists);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function clearWordlists(sdk: BackendSDK): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.clearWordlists();
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function toggleWordlist(
  sdk: BackendSDK,
  path: string,
  enabled: boolean,
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.toggleWordlist(path, enabled);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function updateAttackTypes(
  sdk: BackendSDK,
  path: string,
  attackTypes: AttackType[],
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    if (!wordlistManager) {
      return error("Wordlist manager not initialized");
    }
    await wordlistManager.updateAttackTypes(path, attackTypes);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function importWordlist(
  sdk: BackendSDK,
  data: string,
  filename: string,
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    const filePath = await writeToFile(sdk, data, filename);
    sdk.console.log(`[WORDLIST] Imported wordlist from ${filePath}`);
    await wordlistManager?.addWordlistPath(filePath);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}
