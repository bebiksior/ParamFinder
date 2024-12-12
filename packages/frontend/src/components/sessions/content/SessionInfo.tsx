import { miningSessionStore } from "@/stores/sessionsStore";
import { useStore } from "@nanostores/react";
import { StyledBox } from "caido-material-ui";
import { MiningSessionState } from "shared";
import { Typography, Button, Divider, TextField } from "@mui/material";
import { Chip } from "@mui/material";
import { Stack } from "@mui/material";
import { PlayArrow, Pause, Stop } from "@mui/icons-material";
import { getSDK } from "@/stores/sdkStore";
import { SessionStats } from "./SessionStats";
import { SessionLogs } from "./SessionLogs";
import { SessionResults } from "./SessionResults";
import { computed } from "nanostores";
import { handleBackendCall } from "@/utils/utils";

export default function SessionInfo() {
  const sdk = getSDK();

  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  const sessionState = useStore(
    computed(
      miningSessionStore.getSession(activeSessionId),
      (session) => session?.state
    )
  );

  if (!sessionState) return null;

  const getStateColor = (state: MiningSessionState) => {
    switch (state) {
      case MiningSessionState.Running:
        return "primary";
      case MiningSessionState.Completed:
        return "success";
      case MiningSessionState.Error:
        return "error";
      case MiningSessionState.Paused:
        return "warning";
      case MiningSessionState.Canceled:
        return "default";
      case MiningSessionState.Timeout:
        return "error";
      default:
        return "default";
    }
  };

  const handlePause = () => {
    if (activeSessionId) {
      handleBackendCall(sdk.backend.pauseMining(activeSessionId), sdk);
    }
  };

  const handleResume = () => {
    if (activeSessionId) {
      handleBackendCall(sdk.backend.resumeMining(activeSessionId), sdk);
    }
  };

  const handleCancel = () => {
    if (activeSessionId) {
      handleBackendCall(sdk.backend.cancelMining(activeSessionId), sdk);
    }
  };

  return (
    <StyledBox padding={2} className="overflow-y-auto">
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Session Information</Typography>
          <Stack direction="row" spacing={1}>
            {sessionState === MiningSessionState.Running ? (
              <Button
                size="small"
                variant="outlined"
                onClick={handlePause}
                startIcon={<Pause />}
              >
                Pause
              </Button>
            ) : sessionState === MiningSessionState.Paused ? (
              <Button
                size="small"
                variant="outlined"
                onClick={handleResume}
                startIcon={<PlayArrow />}
              >
                Resume
              </Button>
            ) : null}
            {(sessionState === MiningSessionState.Running ||
              sessionState === MiningSessionState.Paused) && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleCancel}
                startIcon={<Stop />}
                color="error"
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body1">ID: {activeSessionId}</Typography>
          <Chip
            label={sessionState}
            color={getStateColor(sessionState)}
            size="small"
          />
        </Stack>
        <SessionStats />
        <Divider />
        <SessionResults />
        <Divider />
        <SessionLogs />
      </Stack>
    </StyledBox>
  );
}
