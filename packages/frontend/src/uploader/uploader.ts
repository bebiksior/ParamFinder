import { CaidoSDK } from "@/types";
import { EventEmitter } from "events";

const CHUNK_SIZE = 10000;

export async function uploadWordlist(sdk: CaidoSDK, data: {
  content: string;
  filename: string;
}): Promise<EventEmitter> {
    const emitter = new EventEmitter();
    const totalChunks = Math.ceil(data.content.length / CHUNK_SIZE);

    (async () => {
        try {
            const sessionId = await sdk.backend.startWordlistUpload(data.filename, totalChunks);

            for (let i = 0; i < totalChunks; i++) {
                const chunk = data.content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                await sdk.backend.uploadWordlistChunk(sessionId, chunk, i);
                emitter.emit('progress', {
                    current: i + 1,
                    total: totalChunks,
                    percentage: Math.round(((i + 1) / totalChunks) * 100)
                });
            }

            await sdk.backend.finalizeWordlistUpload(sessionId);
            emitter.emit('complete');
        } catch (error) {
            emitter.emit('error', error);
        }
    })();

    return emitter;
}
