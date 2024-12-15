import { Box, LinearProgress } from "@mui/material";

interface UploadProgressProps {
  progress: number | null;
}

export function UploadProgress({ progress }: UploadProgressProps) {
  if (progress === null) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
}
