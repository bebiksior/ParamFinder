import {
  Paper,
  Typography,
  Stack,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  Chip,
  Box,
  MenuItem,
} from "@mui/material";
import { AnomalyType } from "shared";
import { useCallback
 } from "react";
import {
    useSettings,
  useUpdateSettingsField,
} from "@/stores/settingsStore";
import { EmptyPanel } from "../common/EmptyPanel";

export const AdvancedSettingsSection = () => {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsField = useUpdateSettingsField();

  const toggleSetting = useCallback(
    (field: keyof typeof settings) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSettingsField({
          [field]: e.target.checked,
        });
      },
    [settings, updateSettingsField]
  );

  const handleAutoDetectMaxSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateSettingsField({
        autoDetectMaxSize: e.target.checked,
        maxQuerySize: e.target.checked ? undefined : settings.maxQuerySize,
        maxHeaderSize: e.target.checked ? undefined : settings.maxHeaderSize,
        maxBodySize: e.target.checked ? undefined : settings.maxBodySize,
      });
    },
    [settings, updateSettingsField]
  );

  if (isLoading) return <EmptyPanel message="Loading settings..." />;

  return (
    <Paper sx={{ p: 4, flex: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 500 }}>
        Advanced Settings
      </Typography>

      <Stack spacing={2} sx={{ backgroundColor: "transparent" }}>
        <FormControlLabel
          control={
            <Switch
              checked={settings.autoDetectMaxSize}
              onChange={handleAutoDetectMaxSizeChange}
            />
          }
          label="Auto Detect Max Request Size"
        />

        {!settings.autoDetectMaxSize && (
          <Stack
            direction="row"
            spacing={2}
            sx={{
              backgroundColor: "transparent",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <TextField
              label="Max Query Size"
              type="number"
              value={settings.maxQuerySize ?? ""}
              onChange={(e) =>
                updateSettingsField({
                  maxQuerySize: Number(e.target.value),
                })
              }
              sx={{ flex: 1, minWidth: "250px" }}
            />

            <TextField
              label="Max Header Size"
              type="number"
              value={settings.maxHeaderSize ?? ""}
              onChange={(e) =>
                updateSettingsField({
                  maxHeaderSize: Number(e.target.value),
                })
              }
              sx={{ flex: 1, minWidth: "250px" }}
            />

            <TextField
              label="Max Body Size"
              type="number"
              value={settings.maxBodySize ?? ""}
              onChange={(e) =>
                updateSettingsField({
                  maxBodySize: Number(e.target.value),
                })
              }
              sx={{ flex: 1, minWidth: "250px" }}
            />
          </Stack>
        )}

        <Stack spacing={2} sx={{ backgroundColor: "transparent" }}>
          {[
            { field: "wafDetection" as const, label: "WAF Detection" },
            { field: "autopilotEnabled" as const, label: "Autopilot Feature" },
            {
              field: "updateContentLength" as const,
              label: "Update Content-Length",
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
                  checked={settings[field]}
                  onChange={toggleSetting(field)}
                />
              }
              label={label}
            />
          ))}
        </Stack>

        <Stack spacing={1} sx={{ backgroundColor: "transparent" }}>
          <FormControl fullWidth>
            <InputLabel id="ignore-anomaly-types-label">
              Anomaly Types To Ignore
            </InputLabel>
            <Select
              labelId="ignore-anomaly-types-label"
              multiple
              value={settings.ignoreAnomalyTypes}
              onChange={(e) =>
                updateSettingsField({
                  ignoreAnomalyTypes: e.target.value as AnomalyType[],
                })
              }
              input={<OutlinedInput label="Anomaly Types To Ignore" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {(selected as AnomalyType[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {Object.values(AnomalyType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary">
            Some targets may exhibit unusual behavior that triggers false
            positives. Use this setting to ignore specific anomaly types.
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};
