import { miningSessionStore } from '@/stores/sessionsStore';
import { Stack, Typography } from '@mui/material';
import { useStore } from '@nanostores/react';
import { computed } from 'nanostores';

export function SessionLogs() {
  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  const sessionLogs = useStore(
    computed(
      miningSessionStore.getSession(activeSessionId),
      session => session?.logs
    )
  );

  if (!sessionLogs) return null;

  return (
    <Stack>
      <Typography variant="h6" gutterBottom>Logs</Typography>
      <Stack
        sx={{
          maxHeight: '300px',
          overflowY: 'auto',
          bgcolor: 'background.paper',
          p: 1,
          borderRadius: 1
        }}
      >
        {sessionLogs.map((log, index) => (
          <Typography
            key={index}
            variant="body2"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: '1.2',
              userSelect: 'text',
            }}
          >
            {log}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}
