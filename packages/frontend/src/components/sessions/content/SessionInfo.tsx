import { StyledBox } from "caido-material-ui";
import { MiningSessionState } from "shared";
import { Typography, Button, Divider } from "@mui/material";
import { Chip } from "@mui/material";
import { Stack } from "@mui/material";
import { PlayArrow, Pause, Stop } from "@mui/icons-material";
import { getSDK } from "@/stores/sdkStore";
import { SessionStats } from "./SessionStats";
import { SessionLogs } from "./SessionLogs";
import { SessionResults } from "./SessionResults";
import { handleBackendCall } from "@/utils/utils";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useMemo, memo } from "react";

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
    case MiningSessionState.Learning:
      return "info";
    default:
      return "default";
  }
};

const SessionInfo = memo(function SessionInfo() {
  const sdk = getSDK();

  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const sessionState = useSessionsStore((state) =>
    state.activeSessionId ? state.sessions[state.activeSessionId]?.state : undefined
  );

  const handlers = useMemo(() => ({
    handlePause: () => {
      if (activeSessionId) {
        handleBackendCall(sdk.backend.pauseMining(activeSessionId), sdk);
      }
    },
    handleResume: () => {
      if (activeSessionId) {
        handleBackendCall(sdk.backend.resumeMining(activeSessionId), sdk);
      }
    },
    handleCancel: () => {
      if (activeSessionId) {
        handleBackendCall(sdk.backend.cancelMining(activeSessionId), sdk);
      }
    },
  }), [activeSessionId, sdk]);

  if (!sessionState || !activeSessionId) return null;

  const ControlButtons = useMemo(() => (
    <Stack direction="row" spacing={1}>
      {(sessionState === MiningSessionState.Running ||
        sessionState === MiningSessionState.Learning) ? (
        <Button
          size="small"
          variant="outlined"
          onClick={handlers.handlePause}
          startIcon={<Pause />}
        >
          Pause
        </Button>
      ) : sessionState === MiningSessionState.Paused ? (
        <Button
          size="small"
          variant="outlined"
          onClick={handlers.handleResume}
          startIcon={<PlayArrow />}
        >
          Resume
        </Button>
      ) : null}
      {(sessionState === MiningSessionState.Running ||
        sessionState === MiningSessionState.Paused ||
        sessionState === MiningSessionState.Learning) && (
        <Button
          size="small"
          variant="outlined"
          onClick={handlers.handleCancel}
          startIcon={<Stop />}
          color="error"
        >
          Cancel
        </Button>
      )}
    </Stack>
  ), [sessionState, handlers]);

  return (
    <StyledBox padding={2} className="overflow-y-auto">
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">Session Information</Typography>
          {ControlButtons}
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
});

export default SessionInfo;
