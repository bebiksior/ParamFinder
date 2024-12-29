import { Stack, Paper, Typography, TextField } from "@mui/material";
import { formatTimeout } from "@/utils/utils";
import { useMemo } from "react";
import { useSettings, useUpdateSettingsField } from "@/stores/settingsStore";
import { EmptyPanel } from "../common/EmptyPanel";

export const RequestSettingsSection = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsField = useUpdateSettingsField();
  const handleNumberChange = useMemo(
    () =>
      (field: keyof typeof settings) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSettingsField({ [field]: Number(e.target.value) });
      },
    [settings, updateSettingsField]
  );

  if (isLoading) return <EmptyPanel message="Loading settings..." />;

  return (
    <Paper sx={{ p: 4, flex: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
        Request Settings
      </Typography>

      <Stack spacing={3} sx={{ backgroundColor: "transparent" }}>
        <TextField
          label="Request Delay (ms)"
          type="number"
          value={settings.delay}
          onChange={handleNumberChange("delay")}
          helperText={
            settings.delay <= 0
              ? "Invalid value - delay must be greater than 0"
              : `Equivalent to ${formatTimeout(settings.delay)}`
          }
          fullWidth
        />

        <TextField
          label="Request Timeout (seconds)"
          type="number"
          value={settings.timeout}
          onChange={handleNumberChange("timeout")}
          fullWidth
          helperText={
            settings.timeout <= 0
              ? "Invalid value - timeout must be greater than 0"
              : `Equivalent to ${formatTimeout(settings.timeout * 1000)}`
          }
        />

        <TextField
          label="Learn Requests Count"
          type="number"
          value={settings.learnRequestsCount}
          onChange={handleNumberChange("learnRequestsCount")}
          helperText="Minimum value is 3. Recommended value is 8 or more."
          fullWidth
        />

        <TextField
          label="Concurrency"
          type="number"
          value={settings.concurrency}
          onChange={handleNumberChange("concurrency")}
          fullWidth
          disabled
          helperText="Concurrency is not yet implemented."
        />
      </Stack>
    </Paper>
  );
};
