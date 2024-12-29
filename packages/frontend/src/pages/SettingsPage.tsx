import { memo } from "react";
import { StyledBox } from "caido-material-ui";
import { Typography, Stack } from "@mui/material";
import { useSettingsPath } from "@/stores/settingsStore";
import { AdvancedSettingsSection } from "@/components/settings/AdvancedSettingsSection";
import { RequestSettingsSection } from "@/components/settings/RequestSettingsSection";

export default function SettingsPage() {
  const { data: settingsPath } = useSettingsPath();

  return (
    <StyledBox padding={3} className="overflow-y-auto">
      <SettingsContent settingsPath={settingsPath} />
    </StyledBox>
  );
}

const SettingsContent = memo(function SettingsContent({
  settingsPath,
}: {
  settingsPath?: string;
}) {
  return (
    <>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 500 }}>
        Settings
      </Typography>

      <Stack direction="row" spacing={4} sx={{ mb: 4 }}>
        <RequestSettingsSection />
        <AdvancedSettingsSection />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 4, userSelect: "text" }}
      >
        Settings are stored in: {settingsPath}
      </Typography>
    </>
  );
});
