import { useSessionsStore } from "@/stores/sessionsStore";
import { Stack, Typography, TextField, Button } from "@mui/material";
import { ContentCopy, Download } from "@mui/icons-material";
import { getSDK } from "@/stores/sdkStore";
import { useMemo } from "react";

export function SessionResults() {
  const sdk = getSDK();

  const findings = useSessionsStore((state) => {
    const activeSessionId = state.activeSessionId;
    return activeSessionId ? state.sessions[activeSessionId]?.findings : [];
  });

  const parametersText = useMemo(() => {
    if (!findings?.length) return "";
    return findings.map((finding) => finding.parameter.name).join("\n");
  }, [findings]);

  const handlers = useMemo(
    () => ({
      handleCopyParameters: () => {
        navigator.clipboard.writeText(parametersText);
        sdk.window.showToast(
          `Copied ${findings?.length} parameters to clipboard`,
          { variant: "success" }
        );
      },

      handleExportResults: () => {
        const blob = new Blob([parametersText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "parameters.txt";
        a.click();
        URL.revokeObjectURL(url);
      },
    }),
    [findings?.length, parametersText, sdk]
  );

  return (
    <Stack>
      <Typography variant="h6" gutterBottom>
        Results ({findings?.length})
      </Typography>
      <TextField
        multiline
        rows={6}
        value={parametersText}
        InputProps={{
          readOnly: true,
        }}
        fullWidth
        variant="outlined"
        sx={{ mb: 2, fontFamily: "monospace" }}
      />
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button
          variant="outlined"
          startIcon={<ContentCopy />}
          onClick={handlers.handleCopyParameters}
          sx={{ flexGrow: 0 }}
        >
          Copy Parameters ({findings?.length})
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={handlers.handleExportResults}
          sx={{ flexGrow: 0 }}
        >
          Export Results
        </Button>
      </Stack>
    </Stack>
  );
}
