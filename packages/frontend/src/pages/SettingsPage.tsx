import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Stack,
  Button,
  Link,
  Divider,
  Avatar,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
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
            disabled
            helperText="Concurrency is not implemented yet"
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

      <Paper sx={{ p: 3, mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
            About ParamFinder
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<StarIcon />}
            href="https://github.com/bebiksior/ParamFinder"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            Star on GitHub
          </Button>
        </Box>
        <Typography variant="body1">
          <strong>ParamFinder</strong> is a Caido plugin designed to help you discover hidden parameters in web applications. You can find the source code on{" "}
          <Link
            href="https://github.com/bebiksior/ParamFinder"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
          .
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Please note that ParamFinder is currently in beta, and some features like concurrency are not implemented yet. Your feedback and bug reports are highly appreciated!
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Feel free to contribute to the project :D You can submit feature requests and report bugs via the GitHub issues page. I'm always looking for new ideas and improvements!
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="textSecondary">
          Your feedback and suggestions are always welcome. My X profile is{" "}
          <Link
            href="https://x.com/bebiksior"
            target="_blank"
            rel="noopener noreferrer"
          >
            bebiksior
          </Link>{" "}
          and my discord handle is <b>bebiks</b>
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <Avatar
            src="https://avatars.githubusercontent.com/u/71410238?v=4&size=30"
            alt="bebiks avatar"
            sx={{ mr: 1, width: 30, height: 30 }}
          />
          <Typography variant="body2">
            Made with ❤️ by{" "}
            <Link
              href="https://x.com/bebiksior"
              target="_blank"
              rel="noopener noreferrer"
            >
              bebiks
            </Link>
          </Typography>
        </Box>
      </Paper>
    </StyledBox>
  );
}
