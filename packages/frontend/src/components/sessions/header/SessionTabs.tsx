import { Menu, MenuItem } from "@mui/material";
import { useState, MouseEvent, memo } from "react";
import { DeleteSweep } from "@mui/icons-material";
import { StyledBox } from "caido-material-ui";
import { Tab } from "../../common/Tab";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useShallow } from "zustand/shallow";

const SessionTabs = memo(function SessionTabs() {
  const sessionIds = useSessionsStore(
    useShallow((state) => Object.keys(state.sessions))
  );
  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const setActiveSession = useSessionsStore((state) => state.setActiveSession);
  const deleteSession = useSessionsStore((state) => state.deleteSession);

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
    sessionIds.forEach((id) => deleteSession(id));
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (id === activeSessionId) {
      setActiveSession(null);
    }
    deleteSession(id);
  };

  if (sessionIds.length === 0) return null;

  return (
    <StyledBox
      padding={1}
      className="flex gap-2"
      sx={{ height: "auto", flexWrap: "wrap" }}
    >
      {sessionIds.map((id) => (
        <Tab
          key={id}
          sessionId={id}
          label={id}
          onClose={() => handleDelete(id)}
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
});

export default SessionTabs;
