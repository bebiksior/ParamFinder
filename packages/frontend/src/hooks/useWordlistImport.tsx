import { useState, useCallback } from "react";
import { getSDK } from "../stores/sdkStore";
import { uploadWordlist } from "../uploader/uploader";

interface UseWordlistImportReturn {
  uploadProgress: number | null;
  handleFileImport: () => void;
  handlePresetImport: (url: string) => Promise<void>;
  handleImport: (content: string, filename: string) => Promise<void>;
}

export function useWordlistImport(
  onSuccess: () => void
): UseWordlistImportReturn {
  const sdk = getSDK();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleUpload = useCallback(
    async (content: string, filename: string) => {
      setUploadProgress(0);
      const emitter = await uploadWordlist(sdk, { content, filename });

      emitter.on("progress", (progress) => {
        setUploadProgress(progress.percentage);
      });

      emitter.on("complete", () => {
        setUploadProgress(null);
        sdk.window.showToast("Wordlist imported successfully", {
          variant: "success",
        });
        onSuccess();
      });
    },
    [sdk, onSuccess]
  );

  const handleFileImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const content = await file.text();
      await handleUpload(content, file.name);
    };
    input.click();
  }, [handleUpload]);

  const handleImport = useCallback(
    async (content: string, filename: string) => {
      await handleUpload(content, filename);
    },
    [handleUpload]
  );

  const handlePresetImport = useCallback(
    async (url: string) => {
      try {
        const filename = url.split("/").pop() || "preset-wordlist.txt";
        const response = await fetch(url);
        const content = await response.text();
        await handleUpload(content, filename);
      } catch (error) {
        setUploadProgress(null);
        sdk.window.showToast("Failed to import preset wordlist", {
          variant: "error",
        });
      }
    },
    [handleUpload, sdk]
  );

  return {
    uploadProgress,
    handleImport,
    handleFileImport,
    handlePresetImport,
  };
}
