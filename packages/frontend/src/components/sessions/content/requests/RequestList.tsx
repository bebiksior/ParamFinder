import { StyledBox } from "caido-material-ui";
import { useStore } from "@nanostores/react";
import { miningSessionStore, VIEW_CATEGORIES } from "@/stores/sessionsStore";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { computed } from "nanostores";

// Separate computed stores for findings and requests
const getSessionData = (sessionId: string | null, category: string) =>
  computed(
    [miningSessionStore.sessions, miningSessionStore.uiState],
    (sessions, uiState) => {
      if (!sessionId || !sessions[sessionId]) return [];

      return category === VIEW_CATEGORIES.FINDINGS
        ? sessions[sessionId].findings
        : sessions[sessionId].requests;
    }
  );

export default function RequestsList() {
  const uiState = useStore(miningSessionStore.uiState);
  const activeSessionId = useStore(miningSessionStore.activeSessionId);

  // Only subscribe to the relevant data based on active category
  const data = useStore(
    getSessionData(activeSessionId, uiState.activeCategory)
  );
  const setSelectedRequest = miningSessionStore.setSelectedRequest;

  return (
    <StyledBox>
      <TableContainer component={Paper} sx={{ height: "100%" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Status Code</TableCell>
              <TableCell>Length</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item) => (
              <TableRow
                key={item.requestResponse.id}
                hover
                onClick={() => setSelectedRequest(item.requestResponse.id)}
                selected={uiState.selectedRequestId === item.requestResponse.id}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{item.requestResponse.id}</TableCell>
                <TableCell>{item.requestResponse.response.status}</TableCell>
                <TableCell>
                  {item.requestResponse.response.raw.length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledBox>
  );
}
