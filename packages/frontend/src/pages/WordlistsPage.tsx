import { Box, Button, Typography } from "@mui/material";
import { useWordlists, useRefreshWordlist } from "@/stores/wordlistsStore";
import { StyledBox } from "caido-material-ui";
import { UploadProgress } from "@/components/wordlists/UploadProgress";
import { WordlistTable } from "@/components/wordlists/WordlistTable";
import { PresetWordlists } from "@/components/wordlists/PresetWordlists";
import { useWordlistImport } from "@/hooks/useWordlistImport";
import { useWordlistActions } from "@/hooks/useWordlistActions";
import { memo } from "react";

interface WordlistHeaderProps {
  onImport: () => void;
  onClear: () => void;
}

const WordlistHeader = memo(function WordlistHeader({
  onImport,
  onClear,
}: WordlistHeaderProps) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h4">Wordlists</Typography>
      <Box display="flex" gap={2}>
        <Button variant="contained" onClick={onImport}>
          Import Wordlist
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
}

const WordlistContent = memo(function WordlistContent({
  wordlists,
  onToggle,
  onRemove,
  onPresetImport,
}: WordlistContentProps) {
  return (
    <>
      <WordlistTable
        wordlists={wordlists}
        onToggle={onToggle}
        onRemove={onRemove}
      />
      <PresetWordlists onImport={onPresetImport} />
    </>
  );
});

const MemoizedUploadProgress = memo(UploadProgress);

export default function WordlistsPage() {
  const { data: wordlists, isLoading } = useWordlists();
  const refreshWordlist = useRefreshWordlist();

  const { uploadProgress, handleFileImport, handlePresetImport } =
    useWordlistImport(refreshWordlist);

  const { removeWordlist, clearWordlists, handleToggleWordlist } =
    useWordlistActions();

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <StyledBox p={3} className="overflow-y-auto">
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <WordlistHeader onImport={handleFileImport} onClear={clearWordlists} />

        <MemoizedUploadProgress progress={uploadProgress} />

        <WordlistContent
          wordlists={wordlists || []}
          onToggle={handleToggleWordlist}
          onRemove={removeWordlist}
          onPresetImport={handlePresetImport}
        />
      </Box>
    </StyledBox>
  );
}
