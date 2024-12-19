import { Menu, MenuItem } from "@mui/material";
import { useState, MouseEvent, memo } from "react";
import { StyledBox } from "caido-material-ui";
import { Tab } from "../../common/Tab";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useShallow } from "zustand/shallow";
import { getSDK } from "@/stores/sdkStore";

const SessionTabs = memo(function SessionTabs() {
  const sdk = getSDK();
  const sessionIds = useSessionsStore(
    useShallow((state) => Object.keys(state.sessions))
  );
  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const setActiveSession = useSessionsStore((state) => state.setActiveSession);
  const deleteSession = useSessionsStore((state) => state.deleteSession);

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    sessionId: string;
  } | null>(null);

  const handleContextMenu = (event: MouseEvent, sessionId: string) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, sessionId });
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleClearAll = () => {
    sessionIds.forEach((id) => deleteSession(id, sdk));
    handleClose();
  };

  const handleCloseOthers = () => {
    if (!contextMenu) return;

    sessionIds.forEach((id) => {
      if (id !== contextMenu.sessionId) {
        if (id === activeSessionId) {
          setActiveSession(contextMenu.sessionId);
        }
        deleteSession(id, sdk);
      }
    });
    handleClose();
  };

  const handleDelete = (id: string) => {
    if (id === activeSessionId) {
      setActiveSession(null);
    }
    deleteSession(id, sdk);
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
          onContextMenu={(e) => handleContextMenu(e, id)}
        />
      ))}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        MenuListProps={{
          sx: {
            padding: 0,
          },
        }}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        transitionDuration={0}
      >
        <MenuItem onClick={handleCloseOthers}>Close Others</MenuItem>
        <MenuItem onClick={handleClearAll}>Clear All</MenuItem>
      </Menu>
    </StyledBox>
  );
});

export default SessionTabs;
