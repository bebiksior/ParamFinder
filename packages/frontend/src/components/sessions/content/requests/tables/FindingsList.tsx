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

type SortField = "id" | "status" | "length" | "time";
type SortDirection = "asc" | "desc";

export default function FindingsList() {
  const selectedRequestId = useUIStore((state) => state.selectedRequestId);
  const setSelectedRequest = useUIStore((state) => state.setSelectedRequest);

  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const findings = useSessionsStore(
    useShallow((state) => {
      if (!activeSessionId || !state.sessions[activeSessionId]) return [];
      return state.sessions[activeSessionId].findings;
    }),
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

  const sortedFindings = [...findings].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "id":
        return (
          multiplier *
          a.requestResponse.request.id.localeCompare(
            b.requestResponse.request.id,
          )
        );
      case "status":
        return (
          multiplier *
          (a.requestResponse.response.status -
            b.requestResponse.response.status)
        );
      case "length":
        return (
          multiplier *
          (a.requestResponse.response.raw.length -
            b.requestResponse.response.raw.length)
        );
      case "time":
        return (
          multiplier *
          (a.requestResponse.response.time - b.requestResponse.response.time)
        );
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
              <TableCell>Parameter</TableCell>
              <TableCell>Anomaly</TableCell>
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
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedFindings.map((row) => (
              <TableRow
                key={row.requestResponse.request.id}
                hover
                selected={row.requestResponse && row.requestResponse.request.id === selectedRequestId}
                onClick={() => handleClick(row.requestResponse.request.id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>{row.requestResponse.request.id}</TableCell>
                <TableCell>{row.parameter.name}</TableCell>
                <TableCell>{row.anomalyType}</TableCell>
                <TableCell>{row.requestResponse.response.status}</TableCell>
                <TableCell>{row.requestResponse.response.raw.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledBox>
  );
}
