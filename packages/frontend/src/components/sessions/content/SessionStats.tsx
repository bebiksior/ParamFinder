import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useShallow } from "zustand/shallow";

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
  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const activeSessionData = useSessionsStore(
    useShallow((state) => {
      if (!activeSessionId || !state.sessions[activeSessionId]) return null;
      return {
        sentRequests: state.sessions[activeSessionId].sentRequests,
        findings: state.sessions[activeSessionId].findings,
        totalRequests: state.sessions[activeSessionId].totalRequests,
      };
    })
  );

  if (!activeSessionData) return null;

  const discoveryRequests = activeSessionData.sentRequests.filter(
    (request) =>
      request.context === "discovery" ||
      request.context === "learning"
  );

  const parametersTested = discoveryRequests.reduce((acc, request) => {
    return acc + request.parametersSent;
  }, 0);

  const totalRequestsSent = activeSessionData.sentRequests.length;
  const progress =
    (discoveryRequests.length / activeSessionData.totalRequests) * 100;

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 10, borderRadius: 5 }}
      />

      <Box sx={{ display: "flex", gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <StatCard title="Requests Sent" value={totalRequestsSent} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <StatCard title="Parameters Tested" value={parametersTested} />
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
