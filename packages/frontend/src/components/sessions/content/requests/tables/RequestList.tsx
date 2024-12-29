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
import { useShallow } from "zustand/shallow";
import { EmptyPanel } from "@/components/common/EmptyPanel";

type SortField = "id" | "status" | "length" | "time";
type SortDirection = "asc" | "desc";

export default function RequestList() {
  const selectedRequestId = useUIStore((state) => state.selectedRequestId);
  const setSelectedRequest = useUIStore((state) => state.setSelectedRequest);

  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const requestResponses = useSessionsStore(
    useShallow((state) => {
      if (!activeSessionId || !state.sessions[activeSessionId]) return [];
      return state.sessions[activeSessionId].sentRequests.map(
        (sentReq) => sentReq.requestResponse,
      );
    }),
  );

  const isPerformanceMode = requestResponses.some(
    (reqRes) => reqRes === null
  );

  const handleClick = useCallback(
    (id: string) => {
      setSelectedRequest(id);
    },
    [setSelectedRequest],
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
    [sortField, sortDirection],
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

  if (isPerformanceMode) {
    return (
      <EmptyPanel message="Performance Mode is enabled. Request details are not available in this mode." />
    );
  }

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
              <TableCell>Context</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRequests.map((row) => (
              <TableRow
                key={row.request.id}
                hover
                selected={row.request && row.request.id === selectedRequestId}
                onClick={() => handleClick(row.request.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{row.request.id}</TableCell>
                <TableCell>{row.response.status}</TableCell>
                <TableCell>{row.response.raw.length}</TableCell>
                <TableCell>{row.response.time}ms</TableCell>
                <TableCell>{row.request.context}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledBox>
  );
}
