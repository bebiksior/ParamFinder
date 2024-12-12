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

const wordlistPresets = [
  {
    name: "seclists/raft-large-words",
    url: "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Discovery/Web-Content/raft-large-words.txt",
    description: "Large wordlist from SecLists for web content discovery",
  },
  {
    name: "seclists/raft-medium-words",
    url: "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Discovery/Web-Content/raft-medium-words.txt",
    description: "Medium wordlist from SecLists for web content discovery",
  },
  {
    name: "seclists/raft-small-words",
    url: "https://raw.githubusercontent.com/danielmiessler/SecLists/refs/heads/master/Discovery/Web-Content/raft-small-words.txt",
    description: "Small wordlist from SecLists for web content discovery",
  },
  {
    name: "param-miner/words",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/words",
    description: "Common parameter names from ParamMiner",
  },
  {
    name: "param-miner/wafparams",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/wafparams",
    description: "WAF bypass parameters from ParamMiner",
  },
  {
    name: "param-miner/params",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/params",
    description: "General parameters from ParamMiner",
  },
  {
    name: "param-miner/headers",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/headers",
    description: "HTTP header names from ParamMiner",
  },
  {
    name: "param-miner/functions",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/functions",
    description: "Common function names from ParamMiner",
  },
  {
    name: "param-miner/fierce-subdomains",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/fierce-subdomains",
    description: "Subdomain wordlist from ParamMiner",
  },
  {
    name: "param-miner/boring_headers",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/boring_headers",
    description: "Common boring header names from ParamMiner",
  },
  {
    name: "param-miner/assetnote-params",
    url: "https://raw.githubusercontent.com/PortSwigger/param-miner/master/resources/assetnote-params",
    description: "Parameter list from Assetnote via ParamMiner",
  }
];

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

      emitter.on("progress", (progress) => {
        setUploadProgress(progress.percentage);
      });

      emitter.on("complete", () => {
        setUploadProgress(null);
        sdk.window.showToast("Wordlist imported successfully", {
          variant: "success",
        });

        refreshWordlist();
      });
    };
    input.click();
  };

  const handleImportPreset = async (url: string) => {
    try {
      setUploadProgress(0);
      const filename = url.split("/").pop() || "preset-wordlist.txt";
      const response = await fetch(url);
      const content = await response.text();

      const emitter = await uploadWordlist(sdk, {
        content,
        filename,
      });

      emitter.on("progress", (progress) => {
        setUploadProgress(progress.percentage);
      });

      emitter.on("complete", () => {
        setUploadProgress(null);
        sdk.window.showToast("Preset wordlist imported successfully", {
          variant: "success",
        });
        refreshWordlist();
      });
    } catch (error) {
      setUploadProgress(null);
      sdk.window.showToast("Failed to import preset wordlist", {
        variant: "error",
      });
    }
  };

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <StyledBox p={3} className="overflow-y-auto">
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
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
          <Box sx={{ width: "100%" }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
        <Box>
          <Typography variant="h6" gutterBottom>
            Active Wordlists
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            ParamFinder can use multiple wordlists simultaneously. Duplicate
            entries across wordlists will be automatically removed.
          </Typography>
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
                        onChange={() =>
                          toggleWordlist({
                            path: wordlist.path,
                            enabled: !wordlist.enabled,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="select-text">
                      {wordlist.path}
                    </TableCell>
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
        </Box>
        <Box>
          <Typography variant="h6" gutterBottom>
            Preset Wordlists
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Choose from popular wordlists to get started quickly.
          </Typography>
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(250px, 1fr))"
            gap={2}
          >
            {wordlistPresets.map((preset) => (
              <Paper
                key={preset.name}
                elevation={1}
                sx={{
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  height: "100%",
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  {preset.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ flexGrow: 1 }}
                >
                  {preset.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleImportPreset(preset.url)}
                >
                  Import Wordlist
                </Button>
              </Paper>
            ))}
          </Box>
        </Box>
      </Box>
    </StyledBox>
  );
}
