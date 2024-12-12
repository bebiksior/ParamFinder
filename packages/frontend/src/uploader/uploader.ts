import { CaidoSDK } from "@/types";
import { handleBackendCall } from "@/utils/utils";
import { createNanoEvents, Emitter } from "nanoevents";

interface UploadEvents {
  progress: (data: { current: number; total: number; percentage: number }) => void;
  complete: () => void;
  error: (error: unknown) => void;
}

const CHUNK_SIZE = 10000;

export async function uploadWordlist(sdk: CaidoSDK, data: {
  content: string;
  filename: string;
}): Promise<Emitter<UploadEvents>> {
    const emitter = createNanoEvents<UploadEvents>();
    const totalChunks = Math.ceil(data.content.length / CHUNK_SIZE);

    (async () => {
        try {
            const sessionId = await handleBackendCall(sdk.backend.startWordlistUpload(data.filename, totalChunks), sdk);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = data.content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                await handleBackendCall(sdk.backend.uploadWordlistChunk(sessionId, chunk, i), sdk);
                emitter.emit('progress', {
                    current: i + 1,
                    total: totalChunks,
                    percentage: Math.round(((i + 1) / totalChunks) * 100)
                });
            }

            await handleBackendCall(sdk.backend.finalizeWordlistUpload(sessionId), sdk);
            emitter.emit('complete');
        } catch (error) {
            emitter.emit('error', error);
        }
    })();

    return emitter;
}
