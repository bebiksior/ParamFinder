import { useStore } from "@nanostores/react";
import { Menu, MenuItem } from "@mui/material";
import { useState, MouseEvent } from "react";
import { DeleteSweep } from "@mui/icons-material";

import { miningSessionStore } from "@/stores/sessionsStore";
import { StyledBox } from "caido-material-ui";
import { Tab } from "../../common/Tab";

export default function SessionTabs() {
  const sessions = useStore(miningSessionStore.sessions, {
    keys: ["sessions"],
  });
  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  const setActiveSession = miningSessionStore.setActiveSession;
  const deleteSession = miningSessionStore.deleteSession;

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX, mouseY: event.clientY }
        : null
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleClearAll = () => {
    Object.keys(sessions).forEach((id) => deleteSession(id));
    handleClose();
  };

  if (Object.keys(sessions).length === 0) {
    return null;
  }

  return (
    <StyledBox
      padding={1}
      className="flex gap-2"
      sx={{ height: "auto", flexWrap: "wrap" }}
    >
      {Object.entries(sessions).map(([id, session]) => (
        <Tab
          key={id}
          sessionId={id}
          label={id}
          onClose={() => deleteSession(id)}
          isSelected={id === activeSessionId}
          onSelect={() => setActiveSession(id)}
          onContextMenu={handleContextMenu}
        />
      ))}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleClearAll}>
          <DeleteSweep sx={{ mr: 1 }} />
          Clear All Sessions
        </MenuItem>
      </Menu>
    </StyledBox>
  );
}
