import { useStore } from "@nanostores/react";
import { Stack, Typography, TextField, Button } from "@mui/material";
import { ContentCopy, Download } from "@mui/icons-material";
import { miningSessionStore } from "../../../stores/sessionsStore";
import { getSDK } from "@/stores/sdkStore";
import { computed } from "nanostores";

export function SessionResults() {
  const sdk = getSDK();

  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  const sessionFindings = useStore(
    computed(
      miningSessionStore.getSession(activeSessionId),
      session => session?.findings
    )
  );

  if (!sessionFindings) return null;

  const handleCopyParameters = () => {
    const parameters = sessionFindings
      .map((finding) => finding.parameter.name)
      .join("\n");
    navigator.clipboard.writeText(parameters);

    sdk.window.showToast(
      `Copied ${sessionFindings.length} parameters to clipboard`,
      {
        variant: "success",
      }
    );
  };

  const handleExportResults = () => {
    const blob = new Blob(
      [
        sessionFindings
          .map((finding) => finding.parameter.name)
          .join("\n"),
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSessionId}.txt`;
    a.click();
  };

  return (
    <Stack>
      <Typography variant="h6" gutterBottom>
        Results
      </Typography>
      <TextField
        multiline
        rows={6}
        value={sessionFindings
          .map((finding) => finding.parameter.name)
          .join("\n")}
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
          onClick={handleCopyParameters}
          disabled={sessionFindings.length === 0}
          sx={{ flexGrow: 0 }}
        >
          Copy Parameters ({sessionFindings.length})
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download />}
          disabled={sessionFindings.length === 0}
          onClick={handleExportResults}
          sx={{ flexGrow: 0 }}
        >
          Export Results
        </Button>
      </Stack>
    </Stack>
  );
}
