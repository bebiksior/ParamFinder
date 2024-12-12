import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Stack,
} from "@mui/material";
import {
  useSettings,
  useUpdateSettings,
  useSettingsPath,
} from "@/stores/settingsStore";
import { StyledBox } from "caido-material-ui";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { data: settingsPath } = useSettingsPath();

  if (isLoading) {
    return (
      <Container maxWidth="lg">
        <Box py={4}>
          <Typography variant="h4">Loading settings...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <StyledBox padding={2}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          General Settings
        </Typography>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 2, userSelect: "text" }}
        >
          Settings are stored in: {settingsPath}
        </Typography>

        <Stack spacing={3} sx={{ maxWidth: 400, backgroundColor: "transparent" }}>
          <TextField
            label="Request Delay (ms)"
            type="number"
            value={settings?.delay}
            onChange={(e) =>
              updateSettings({ ...settings!, delay: Number(e.target.value) })
            }
            fullWidth
          />
          <TextField
            label="Concurrency"
            type="number"
            value={settings?.concurrency}
            onChange={(e) =>
              updateSettings({
                ...settings!,
                concurrency: Number(e.target.value),
              })
            }
            fullWidth
          />
          <TextField
            label="Request Timeout (ms)"
            type="number"
            value={settings?.timeout}
            onChange={(e) =>
              updateSettings({ ...settings!, timeout: Number(e.target.value) })
            }
            fullWidth
          />
        </Stack>
      </Paper>
    </StyledBox>
  );
}
