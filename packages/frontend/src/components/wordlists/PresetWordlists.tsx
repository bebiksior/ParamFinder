import { Box, Paper, Typography, Button } from "@mui/material";
import { memo } from "react";
import { wordlistPresets } from "../../wordlist-presets";

interface PresetWordlistsProps {
  onImport: (url: string) => void;
}

export const PresetWordlists = memo(function PresetWordlists({
  onImport,
}: PresetWordlistsProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preset Wordlists
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Choose from popular wordlists to get started quickly.
      </Typography>
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))"
        gap={2}
      >
        {wordlistPresets.map((preset) => (
          <Paper
            key={preset.name}
            elevation={1}
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              height: "100%",
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              {preset.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flexGrow: 1 }}
            >
              {preset.description}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onImport(preset.url)}
            >
              Import Wordlist
            </Button>
          </Paper>
        ))}
      </Box>
    </Box>
  );
});
