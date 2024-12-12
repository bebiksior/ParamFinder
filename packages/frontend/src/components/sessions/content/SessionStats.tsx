import { Box, Card, CardContent, LinearProgress, Stack, Typography } from "@mui/material";
import { useStore } from "@nanostores/react";
import { miningSessionStore } from "@/stores/sessionsStore";
import { computed } from "nanostores";

interface StatCardProps {
  title: string;
  value: string | number;
}

function StatCard({ title, value }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" component="div">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function SessionStats() {
  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  const activeSessionData = useStore(
    computed(
      miningSessionStore.getSession(activeSessionId),
      (session) => {
        return {
          requests: session?.requests ?? [],
          findings: session?.findings ?? [],
          totalRequests: session?.totalRequests ?? 0,
        };
      },
    ),
  );

  const parametersTested = activeSessionData.requests.reduce((acc, request) => {
    return acc + request.parametersCount;
  }, 0);

  const totalRequestsSent = activeSessionData.requests.length;
  const discoveryRequestsSent = activeSessionData.requests.filter(request => request.context === "discovery").length;

  const progress = (discoveryRequestsSent / activeSessionData.totalRequests) * 100;

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 10, borderRadius: 5 }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title="Requests Sent"
            value={totalRequestsSent}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title="Parameters Tested"
            value={parametersTested}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard
            title="Findings"
            value={activeSessionData.findings.length}
          />
        </Box>
      </Box>
    </Stack>
  );
}
