import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { useWordlists, useRefreshWordlist } from "@/stores/wordlistsStore";
import { StyledBox } from "caido-material-ui";
import { UploadProgress } from "@/components/wordlists/UploadProgress";
import { WordlistTable } from "@/components/wordlists/WordlistTable";
import { PresetWordlists } from "@/components/wordlists/PresetWordlists";
import { useWordlistImport } from "@/hooks/useWordlistImport";
import { useWordlistActions } from "@/hooks/useWordlistActions";
import { memo, useState } from "react";
import { AttackType } from "shared";

interface WordlistHeaderProps {
  onImport: () => void;
  onCreate: () => void;
  onClear: () => void;
}

const WordlistHeader = memo(function WordlistHeader({
  onImport,
  onCreate,
  onClear,
}: WordlistHeaderProps) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h4">Wordlists</Typography>
      <Box display="flex" gap={2}>
        <Button variant="contained" onClick={onCreate}>
          Create
        </Button>
        <Button variant="contained" onClick={onImport}>
          Upload
        </Button>
        <Button variant="outlined" color="error" onClick={onClear}>
          Clear All
        </Button>
      </Box>
    </Box>
  );
});

interface WordlistContentProps {
  wordlists: any[];
  onToggle: (path: string, enabled: boolean) => void;
  onRemove: (id: string) => void;
  onPresetImport: (preset: string) => void;
  onUpdateAttackTypes: (path: string, attackTypes: AttackType[]) => void;
}

const WordlistContent = memo(function WordlistContent({
  wordlists,
  onToggle,
  onRemove,
  onPresetImport,
  onUpdateAttackTypes,
}: WordlistContentProps) {
  return (
    <>
      <WordlistTable
        wordlists={wordlists}
        onToggle={onToggle}
        onRemove={onRemove}
        onUpdateAttackTypes={onUpdateAttackTypes}
      />
      <PresetWordlists onImport={onPresetImport} />
    </>
  );
});

const MemoizedUploadProgress = memo(UploadProgress);

export default function WordlistsPage() {
  const { data: wordlists, isLoading } = useWordlists();
  const refreshWordlist = useRefreshWordlist();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wordlistContent, setWordlistContent] = useState("");
  const [wordlistName, setWordlistName] = useState("");

  const { uploadProgress, handleFileImport, handleImport, handlePresetImport } =
    useWordlistImport(refreshWordlist);

  const { removeWordlist, clearWordlists, handleToggleWordlist, handleUpdateAttackTypes } =
    useWordlistActions();

  const handleCreateWordlist = async () => {
    if (wordlistContent.trim() && wordlistName.trim()) {
      const filename = `${wordlistName.trim()}.txt`;
      await handleImport(wordlistContent, filename);
      setWordlistContent("");
      setWordlistName("");
      setCreateDialogOpen(false);
    }
  };

  if (isLoading) return <Typography>Loading...</Typography>;
  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <StyledBox p={3} className="overflow-y-auto">
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <WordlistHeader
          onImport={handleFileImport}
          onClear={clearWordlists}
          onCreate={() => setCreateDialogOpen(true)}
        />

        <MemoizedUploadProgress progress={uploadProgress} />

        <WordlistContent
          wordlists={wordlists || []}
          onToggle={handleToggleWordlist}
          onRemove={removeWordlist}
          onPresetImport={handlePresetImport}
          onUpdateAttackTypes={handleUpdateAttackTypes}
        />
      </Box>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Wordlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            value={wordlistName}
            onChange={(e) => setWordlistName(e.target.value)}
            placeholder="Enter wordlist name"
            fullWidth
            variant="outlined"
            margin="dense"
          />
          <TextField
            multiline
            rows={10}
            value={wordlistContent}
            onChange={(e) => setWordlistContent(e.target.value)}
            placeholder="Enter your wordlist here (one word per line)"
            fullWidth
            variant="outlined"
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWordlist}
            variant="contained"
            disabled={!wordlistName.trim() || !wordlistContent.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </StyledBox>
  );
}
