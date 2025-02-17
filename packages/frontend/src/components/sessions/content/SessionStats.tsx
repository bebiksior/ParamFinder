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
import { MiningSessionPhase } from "shared";

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
      const activeSession = state.sessions[activeSessionId];
      if (!activeSessionId || !activeSession) return null;
      return {
        sentRequests: activeSession.sentRequests,
        findings: activeSession.findings,
        phase: activeSession.phase,
        totalParametersAmount: activeSession.totalParametersAmount,
        totalLearnRequests: activeSession.totalLearnRequests,
      };
    })
  );

  if (!activeSessionData) return null;

  const discoveryRequests = activeSessionData.sentRequests.filter(
    (request) => request.context === "discovery"
  );

  const parametersTested = discoveryRequests.reduce((acc, request) => {
    return acc + request.parametersSent;
  }, 0);

  const totalRequestsSent = activeSessionData.sentRequests.length;
  const learningRequestsAmount = activeSessionData.sentRequests.filter(
    (request) => request.context === "learning"
  ).length;

  const progress =
    activeSessionData.phase === MiningSessionPhase.Learning
      ? Math.min(
          (learningRequestsAmount / activeSessionData.totalLearnRequests) * 100,
          100
        )
      : (parametersTested / activeSessionData.totalParametersAmount) * 100;

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
