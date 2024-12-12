import { Tab } from "@mui/material";

import { Tabs } from "@mui/material";
import RadarIcon from "@mui/icons-material/Radar";
import SettingsIcon from "@mui/icons-material/Settings";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

interface HeaderProps {
  activeComponent: string;
  setActiveComponent: (value: string) => void;
}

export default function Header({
  activeComponent,
  setActiveComponent,
}: HeaderProps) {
  return (
    <Tabs
      value={activeComponent}
      onChange={(event, newValue) => setActiveComponent(newValue)}
    >
      <Tab
        value="Sessions"
        iconPosition="start"
        label="Sessions"
        icon={<RadarIcon />}
      />
      <Tab
        value="Wordlists"
        iconPosition="start"
        label="Wordlists"
        icon={<InsertDriveFileIcon />}
      />
      <Tab
        value="Settings"
        iconPosition="start"
        label="Settings"
        icon={<SettingsIcon />}
      />
    </Tabs>
  );
}
