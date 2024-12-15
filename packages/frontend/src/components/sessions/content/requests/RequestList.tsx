import { StyledBox } from "caido-material-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { VIEW_CATEGORIES } from "@/stores/uiStore";
import { useShallow } from "zustand/shallow";

type SortField = "id" | "status" | "length" | "time";
type SortDirection = "asc" | "desc";

export default function RequestList() {
  const { activeCategory, selectedRequestId, setSelectedRequest } =
    useUIStore();
  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const requestResponses = useSessionsStore(
    useShallow((state) => {
      if (!activeSessionId || !state.sessions[activeSessionId]) return [];
      const session = state.sessions[activeSessionId];
      if (activeCategory === VIEW_CATEGORIES.FINDINGS) {
        return session.findings.map((finding) => finding.requestResponse);
      }
      return session.sentRequests
        .filter((req) => req.requestResponse)
        .map((req) => req.requestResponse!);
    })
  );

  const handleClick = useCallback(
    (id: string) => {
      setSelectedRequest(id);
    },
    [setSelectedRequest]
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    },
    [sortField, sortDirection]
  );

  const sortedRequests = [...requestResponses].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "id":
        return multiplier * a.request.id.localeCompare(b.request.id);
      case "status":
        return multiplier * (a.response.status - b.response.status);
      case "length":
        return multiplier * (a.response.raw.length - b.response.raw.length);
      case "time":
        return multiplier * (a.response.time - b.response.time);
      default:
        return 0;
    }
  });

  if (!activeSessionId) return null;

  return (
    <StyledBox className="overflow-auto">
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === "id"}
                  direction={sortField === "id" ? sortDirection : "asc"}
                  onClick={() => handleSort("id")}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === "status"}
                  direction={sortField === "status" ? sortDirection : "asc"}
                  onClick={() => handleSort("status")}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === "length"}
                  direction={sortField === "length" ? sortDirection : "asc"}
                  onClick={() => handleSort("length")}
                >
                  Length
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === "time"}
                  direction={sortField === "time" ? sortDirection : "asc"}
                  onClick={() => handleSort("time")}
                >
                  Time
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRequests.map((row) => (
              <TableRow
                key={row.request.id}
                hover
                selected={row.request.id === selectedRequestId}
                onClick={() => handleClick(row.request.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{row.request.id}</TableCell>
                <TableCell>{row.response.status}</TableCell>
                <TableCell>{row.response.raw.length}</TableCell>
                <TableCell>{row.response.time}ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledBox>
  );
}
