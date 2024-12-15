import {
  Box,
  Paper,
  Typography,
  TextField,
  Stack,
  Button,
  Link,
  Divider,
  Avatar,
  FormControlLabel,
  Switch,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import {
  useSettings,
  useUpdateSettings,
  useSettingsPath,
} from "@/stores/settingsStore";
import { StyledBox } from "caido-material-ui";
import { useState, useEffect, useCallback } from "react";
import { getSDK } from "@/stores/sdkStore";

export default function SettingsPage() {
  const sdk = getSDK();
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const { data: settingsPath } = useSettingsPath();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const debouncedSave = useCallback(
    (newSettings: typeof settings) => {
      if (!newSettings) return;

      if (newSettings.learnRequestsCount < 3) {
        sdk.window.showToast("Learn Requests Count must be at least 3", {
          variant: "error",
        });
        return;
      }

      if (newSettings.delay < 0) {
        sdk.window.showToast("Request Delay must be at least 0", {
          variant: "error",
        });
        return;
      }

      if (newSettings.timeout < 0) {
        sdk.window.showToast("Request Timeout must be at least 0", {
          variant: "error",
        });
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

    const timeoutId = setTimeout(() => {
      debouncedSave(localSettings);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localSettings, settings, debouncedSave]);

  return (
    <StyledBox padding={3} className="overflow-y-auto">
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="h4">Settings</Typography>
      </Box>

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

        <Stack
          spacing={3}
          sx={{ maxWidth: 400, backgroundColor: "transparent" }}
        >
          <TextField
            label="Request Delay (ms)"
            type="number"
            value={localSettings?.delay ?? ""}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings!,
                delay: Number(e.target.value),
              })
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Concurrency"
            type="number"
            value={localSettings?.concurrency ?? ""}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings!,
                concurrency: Number(e.target.value),
              })
            }
            fullWidth
            disabled
            helperText="Concurrency is not implemented yet"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Request Timeout (ms)"
            type="number"
            value={localSettings?.timeout ?? ""}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings!,
                timeout: Number(e.target.value),
              })
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.autoDetectMaxSize ?? false}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    autoDetectMaxSize: e.target.checked,
                    maxQuerySize: e.target.checked
                      ? undefined
                      : localSettings?.maxQuerySize,
                  })
                }
              />
            }
            label="Auto Detect Max Request Size"
          />
          {!localSettings?.autoDetectMaxSize && (
            <>
              <TextField
                label="Max Request Size"
                type="number"
                value={localSettings?.maxQuerySize ?? ""}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    maxQuerySize: Number(e.target.value),
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Max Header Size"
                type="number"
                value={localSettings?.maxHeaderSize ?? ""}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    maxHeaderSize: Number(e.target.value),
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Max Body Size"
                type="number"
                value={localSettings?.maxBodySize ?? ""}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    maxBodySize: Number(e.target.value),
                  })
                }
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.wafDetection ?? false}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    wafDetection: e.target.checked,
                  })
                }
              />
            }
            label="WAF Detection"
          />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.debug ?? false}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    debug: e.target.checked,
                  })
                }
              />
            }
            label="Debug Mode (extensive logging)"
          />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings?.performanceMode ?? false}
                onChange={(e) =>
                  setLocalSettings({
                    ...localSettings!,
                    performanceMode: e.target.checked,
                  })
                }
              />
            }
            label="Performance Mode (receive only findings)"
          />
          <TextField
            label="Learn Requests Count"
            type="number"
            value={localSettings?.learnRequestsCount ?? ""}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings!,
                learnRequestsCount: Number(e.target.value),
              })
            }
            helperText="Minimum value is 3. Recommended value is 8 or more."
            fullWidth
            InputLabelProps={{ shrink: true }}
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
          <Typography
            variant="h6"
            gutterBottom
            fontWeight="bold"
            color="primary"
          >
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
          <strong>ParamFinder</strong> is a Caido plugin designed to help you
          discover hidden parameters in web applications. You can find the
          source code on{" "}
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
          Please note that ParamFinder is currently in beta, and some features
          like concurrency are not implemented yet. Your feedback and bug
          reports are highly appreciated!
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          Feel free to contribute to the project :D You can submit feature
          requests and report bugs via the GitHub issues page. I'm always
          looking for new ideas and improvements!
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
