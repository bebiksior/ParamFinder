import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Checkbox,
  Box,
  Chip,
} from "@mui/material";
import type { Wordlist, AttackType } from "shared";
import { memo } from "react";

interface WordlistTableProps {
  wordlists: Wordlist[];
  onToggle: (path: string, enabled: boolean) => void;
  onRemove: (path: string) => void;
  onUpdateAttackTypes: (path: string, attackTypes: AttackType[]) => void;
}

export const WordlistTable = memo(function WordlistTable({
  wordlists,
  onToggle,
  onRemove,
  onUpdateAttackTypes,
}: WordlistTableProps) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Active Wordlists
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        ParamFinder can use multiple wordlists simultaneously. Duplicate entries
        across wordlists will be automatically removed.
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Enabled</TableCell>
              <TableCell>Path</TableCell>
              <TableCell>Attack Types</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wordlists?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="text.secondary">No wordlists available</Typography>
                </TableCell>
              </TableRow>
            ) : (
              wordlists?.map((wordlist: Wordlist) => (
                <TableRow key={wordlist.path}>
                  <TableCell>
                    <Checkbox
                      checked={wordlist.enabled}
                      onChange={() => onToggle(wordlist.path, !wordlist.enabled)}
                    />
                  </TableCell>
                  <TableCell className="select-text">{wordlist.path}</TableCell>
                  <TableCell>
                    {["body", "headers", "query"].map((attackType) => {
                      const isSelected = wordlist.attackTypes.includes(attackType as AttackType);
                      const handleClick = () => {
                        const newAttackTypes = isSelected
                          ? wordlist.attackTypes.filter(type => type !== attackType)
                          : [...wordlist.attackTypes, attackType as AttackType];
                        onUpdateAttackTypes(wordlist.path, newAttackTypes);
                      };

                      return (
                        <Chip key={attackType}
                          label={attackType}
                          onClick={handleClick}
                          color={isSelected ? "primary" : "default"}
                          variant={isSelected ? "filled" : "outlined"}
                          size="small"
                          sx={{ marginRight: 1 }}
                          style={{ cursor: "pointer" }}
                        />
                      );
                    })}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      color="error"
                      size="small"
                      onClick={() => onRemove(wordlist.path)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});
