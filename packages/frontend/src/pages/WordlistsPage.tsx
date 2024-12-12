import { useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  LinearProgress,
} from "@mui/material";
import {
  useWordlists,
  useRemoveWordlist,
  useClearWordlists,
  useToggleWordlist,
  useRefreshWordlist,
} from "@/stores/wordlistsStore";
import { StyledBox } from "caido-material-ui";
import { getSDK } from "@/stores/sdkStore";
import type { Wordlist } from "shared";
import { uploadWordlist } from "@/uploader/uploader";
import { useQueryClient } from "@tanstack/react-query";

export default function WordlistsPage() {
  const sdk = getSDK();
  const { data: wordlists, isLoading } = useWordlists();
  const { mutate: removeWordlist } = useRemoveWordlist();
  const { mutate: clearWordlists } = useClearWordlists();
  const { mutate: toggleWordlist } = useToggleWordlist();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const refreshWordlist = useRefreshWordlist();

  const handleImportWordlist = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploadProgress(0);
      const content = await file.text();
      const emitter = await uploadWordlist(sdk, {
        content,
        filename: file.name,
      });

      emitter.on('progress', (progress) => {
        setUploadProgress(progress.percentage);
      });

      emitter.on('complete', () => {
        setUploadProgress(null);
        sdk.window.showToast("Wordlist imported successfully", {
          variant: "success",
        });

        refreshWordlist();
      });
    };
    input.click();
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <StyledBox p={3}>
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        mb={3}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4">Wordlists</Typography>
          <Box display="flex" gap={2}>
            <Button variant="contained" onClick={handleImportWordlist}>
              Import Wordlist
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => clearWordlists()}
            >
              Clear All
            </Button>
          </Box>
        </Box>
        {uploadProgress !== null && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          ParamFinder can use multiple wordlists simultaneously. Duplicate entries across wordlists will be automatically removed.
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
            <TableCell>Enabled</TableCell>
              <TableCell>Path</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {wordlists?.map((wordlist: Wordlist) => (
              <TableRow key={wordlist.path}>
                <TableCell>
                  <Checkbox
                    checked={wordlist.enabled}
                    onChange={() => toggleWordlist({ path: wordlist.path, enabled: !wordlist.enabled })}
                  />
                </TableCell>
                <TableCell className="select-text">{wordlist.path}</TableCell>
                <TableCell align="right">
                  <Button
                    color="error"
                    size="small"
                    onClick={() => removeWordlist(wordlist.path)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </StyledBox>
  );
}
