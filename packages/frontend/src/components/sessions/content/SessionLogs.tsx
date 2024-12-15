import { useSessionsStore } from "@/stores/sessionsStore";
import { Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useRef } from "react";
import { useShallow } from "zustand/shallow";

export function SessionLogs() {
  const logs = useSessionsStore(
    useShallow((state) => {
      const activeSessionId = state.activeSessionId;
      if (!activeSessionId || !state.sessions[activeSessionId]) return [];
      return state.sessions[activeSessionId].logs;
    })
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement || !shouldScrollRef.current) return;

    scrollElement.scrollTop = scrollElement.scrollHeight;
  }, [logs]);

  const handleScroll = () => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const isAtBottom = Math.abs(
      scrollElement.scrollHeight - scrollElement.clientHeight - scrollElement.scrollTop
    ) < 1;

    shouldScrollRef.current = isAtBottom;
  };

  const LogsContent = useMemo(() => {
    if (!logs.length) return null;

    return (
      <Stack
        ref={scrollRef}
        onScroll={handleScroll}
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
