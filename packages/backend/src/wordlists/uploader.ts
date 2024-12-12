import { SDK } from "caido:plugin";
import { writeToFile } from "../helper/helper";
import { generateID } from "../helper/helper";

interface UploadSession {
  id: string;
  chunks: string[];
  filename: string;
  totalChunks: number;
  receivedChunks: number;
}

const uploadSessions = new Map<string, UploadSession>();

function startUploadSession(filename: string, totalChunks: number): string {
  const sessionId = generateID();
  uploadSessions.set(sessionId, {
    id: sessionId,
    chunks: [],
    filename,
    totalChunks,
    receivedChunks: 0
  });
  return sessionId;
}

function uploadChunk(sessionId: string, chunk: string, chunkIndex: number): void {
  const session = uploadSessions.get(sessionId);
  if (!session) {
    throw new Error("Upload session not found");
  }

  session.chunks[chunkIndex] = chunk;
  session.receivedChunks++;
}

async function finalizeUpload(sessionId: string, sdk: SDK): Promise<string> {
  const session = uploadSessions.get(sessionId);
  if (!session) {
    throw new Error("Upload session not found");
  }

  if (session.receivedChunks !== session.totalChunks) {
    throw new Error("Not all chunks received");
  }

  // Combine all chunks
  const completeFile = session.chunks.join('');

  // Write to file
  const filePath = await writeToFile(sdk, completeFile, session.filename);

  // Cleanup session
  uploadSessions.delete(sessionId);

  return filePath;
}

function cancelUpload(sessionId: string): void {
  if (!uploadSessions.has(sessionId)) {
    throw new Error("Upload session not found");
  }
  uploadSessions.delete(sessionId);
}

export {
  startUploadSession,
  uploadChunk,
  finalizeUpload,
  cancelUpload
};
