import { error, ok, Result } from "shared";
import { BackendSDK } from "../types/types";
import {
  cancelUpload,
  finalizeUpload,
  startUploadSession,
  uploadChunk,
} from "../wordlists/uploader";
import { getWordlistManager } from "../wordlists/wordlists";

export async function startWordlistUpload(
  sdk: BackendSDK,
  filename: string,
  totalChunks: number,
): Promise<Result<string>> {
  try {
    const sessionId = startUploadSession(filename, totalChunks);
    return ok(sessionId);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function uploadWordlistChunk(
  sdk: BackendSDK,
  sessionId: string,
  chunk: string,
  chunkIndex: number,
): Promise<Result<void>> {
  try {
    uploadChunk(sessionId, chunk, chunkIndex);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function finalizeWordlistUpload(
  sdk: BackendSDK,
  sessionId: string,
): Promise<Result<void>> {
  const wordlistManager = getWordlistManager();

  try {
    const filePath = await finalizeUpload(sessionId, sdk);
    await wordlistManager?.addWordlistPath(filePath);
    sdk.console.log(`[WORDLIST] Imported wordlist from ${filePath}`);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}

export async function cancelWordlistUpload(
  sdk: BackendSDK,
  sessionId: string,
): Promise<Result<void>> {
  try {
    cancelUpload(sessionId);
    return ok(void 0);
  } catch (err) {
    return error(err instanceof Error ? err.message : String(err));
  }
}
