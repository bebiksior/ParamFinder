import { useSessionsStore } from "@/stores/sessionsStore";
import { Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { useShallow } from "zustand/shallow";

export function SessionLogs() {
  const logs = useSessionsStore(
    useShallow((state) => {
      const activeSessionId = state.activeSessionId;
      if (!activeSessionId || !state.sessions[activeSessionId]) return [];
      return state.sessions[activeSessionId].logs;
    })
  );

  const LogsContent = useMemo(() => {
    if (!logs.length) return null;

    return (
      <Stack
        sx={{
          maxHeight: "450px",
          overflowY: "auto",
          bgcolor: "background.paper",
          p: 1,
          borderRadius: 1,
        }}
      >
        {logs.map((log, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.875rem",
              lineHeight: "1.2",
              userSelect: "text",
            }}
          >
            {log}
          </Typography>
        ))}
      </Stack>
    );
  }, [logs]);

  if (!logs.length) return null;

  return (
    <Stack>
      <Typography variant="h6" gutterBottom>
        Logs
      </Typography>
      {LogsContent}
    </Stack>
  );
}
