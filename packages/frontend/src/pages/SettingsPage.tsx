import {
  Paper,
  Typography,
  TextField,
  Stack,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";
import {
  useSettings,
  useUpdateSettings,
  useSettingsPath,
} from "@/stores/settingsStore";
import { StyledBox } from "caido-material-ui";
import { useState, useEffect, useCallback } from "react";
import { getSDK } from "@/stores/sdkStore";
import { About } from "@/components/containers/About";

function formatTimeout(milliseconds: number): string {
  if (milliseconds < 1000) return `${milliseconds} milliseconds`;

  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  const remainingMilliseconds = milliseconds % 1000;

  const parts = [];
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  }
  if (seconds > 0) {
    parts.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  }
  if (remainingMilliseconds > 0) {
    parts.push(`${remainingMilliseconds} milliseconds`);
  }

  return parts.join(' and ');
}

export default function SettingsPage() {
  const sdk = getSDK();
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { data: settingsPath } = useSettingsPath();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  const handleSettingsChange = useCallback(
    <T extends number | boolean>(field: keyof typeof settings, value: T) => {
      if (!localSettings) return;
      setLocalSettings((prev) => ({ ...prev!, [field]: value }));
    },
    [localSettings]
  );

  const debouncedSave = useCallback(
    (newSettings: typeof settings) => {
      if (!newSettings) return;

      const validations = [
        {
          condition: newSettings.learnRequestsCount < 3,
          message: "Learn Requests Count must be at least 3",
        },
        {
          condition: newSettings.delay < 0,
          message: "Request Delay must be at least 0",
        },
        {
          condition: newSettings.timeout < 0,
          message: "Request Timeout must be at least 0",
        },
      ];

      const error = validations.find((v) => v.condition);
      if (error) {
        sdk.window.showToast(error.message, { variant: "error" });
        return;
      }

      updateSettings(newSettings);
    },
    [updateSettings, sdk.window]
  );

  useEffect(() => {
    if (
      !localSettings ||
      JSON.stringify(settings) === JSON.stringify(localSettings)
    ) {
      return;
    }

    const timeoutId = setTimeout(() => debouncedSave(localSettings), 200);
    return () => clearTimeout(timeoutId);
  }, [localSettings, settings, debouncedSave]);

  if (!localSettings) return null;

  return (
    <StyledBox padding={3} className="overflow-y-auto">
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 500 }}>
        Settings
      </Typography>

      <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
        <Paper sx={{ p: 4, flex: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
            Request Settings
          </Typography>
          <Stack spacing={3} sx={{ backgroundColor: "transparent" }}>
            <TextField
              label="Request Delay (ms)"
              type="number"
              value={localSettings.delay}
              onChange={(e) =>
                handleSettingsChange("delay", Number(e.target.value))
              }
              helperText={
                localSettings.delay <= 0
                  ? "Invalid value - delay must be greater than 0"
                  : `Equivalent to ${formatTimeout(localSettings.delay)}`
              }
              fullWidth
            />
            <TextField
              label="Request Timeout (seconds)"
              type="number"
              value={localSettings.timeout}
              onChange={(e) =>
                handleSettingsChange("timeout", Number(e.target.value))
              }
              fullWidth
              helperText={
                localSettings.timeout <= 0
                  ? "Invalid value - timeout must be greater than 0"
                  : `Equivalent to ${formatTimeout(localSettings.timeout * 1000)}`
              }
            />
            <TextField
              label="Learn Requests Count"
              type="number"
              value={localSettings.learnRequestsCount}
              onChange={(e) =>
                handleSettingsChange(
                  "learnRequestsCount",
                  Number(e.target.value)
                )
              }
              helperText="Minimum value is 3. Recommended value is 8 or more."
              fullWidth
            />
            <TextField
              label="Concurrency"
              type="number"
              value={localSettings.concurrency}
              onChange={(e) =>
                handleSettingsChange("concurrency", Number(e.target.value))
              }
              fullWidth
              disabled
              helperText="Concurrency is not implemented yet"
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 4, flex: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
            Advanced Settings
          </Typography>
          <Stack spacing={3} sx={{ backgroundColor: "transparent" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.autoDetectMaxSize}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      autoDetectMaxSize: e.target.checked,
                      maxQuerySize: e.target.checked
                        ? undefined
                        : localSettings.maxQuerySize,
                    })
                  }
                />
              }
              label="Auto Detect Max Request Size"
            />

            {!localSettings.autoDetectMaxSize && (
              <Stack spacing={3} sx={{ backgroundColor: "transparent" }}>
                <TextField
                  label="Max Request Size"
                  type="number"
                  value={localSettings.maxQuerySize ?? ""}
                  onChange={(e) =>
                    handleSettingsChange("maxQuerySize", Number(e.target.value))
                  }
                  fullWidth
                />
                <TextField
                  label="Max Header Size"
                  type="number"
                  value={localSettings.maxHeaderSize ?? ""}
                  onChange={(e) =>
                    handleSettingsChange(
                      "maxHeaderSize",
                      Number(e.target.value)
                    )
                  }
                  fullWidth
                />
                <TextField
                  label="Max Body Size"
                  type="number"
                  value={localSettings.maxBodySize ?? ""}
                  onChange={(e) =>
                    handleSettingsChange("maxBodySize", Number(e.target.value))
                  }
                  fullWidth
                />
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />

            <Stack spacing={2} sx={{ backgroundColor: "transparent" }}>
              {[
                {
                  field: "wafDetection" as const,
                  label: "WAF Detection",
                },
                {
                  field: "debug" as const,
                  label: "Debug Mode (extensive logging)",
                },
                {
                  field: "performanceMode" as const,
                  label: "Performance Mode (receive only findings)",
                },
              ].map(({ field, label }) => (
                <FormControlLabel
                  key={field}
                  control={
                    <Switch
                      checked={localSettings[field]}
                      onChange={(e) =>
                        handleSettingsChange(field, e.target.checked)
                      }
                    />
                  }
                  label={label}
                />
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 4, userSelect: "text" }}
      >
        Settings are stored in: {settingsPath}
      </Typography>

      <About />
    </StyledBox>
  );
}
