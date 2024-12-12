import { StyledBox, StyledSplitter } from "caido-material-ui";
import { useStore } from "@nanostores/react";
import { miningSessionStore, VIEW_CATEGORIES } from "@/stores/sessionsStore";
import { Tabs, Tab } from "@mui/material";
import RequestList from "./RequestList";
import RequestDetails from "./RequestDetails";

export default function RequestsData() {
  const uiState = useStore(miningSessionStore.uiState);

  return (
    <StyledBox className="flex flex-col">
      <Tabs
        value={uiState.activeCategory}
        onChange={(_, newValue) => miningSessionStore.setActiveCategory(newValue)}
      >
        <Tab value={VIEW_CATEGORIES.REQUESTS} label="Requests" />
        <Tab value={VIEW_CATEGORIES.FINDINGS} label="Findings" />
      </Tabs>

      <StyledSplitter vertical>
        <RequestList />
        <RequestDetails />
      </StyledSplitter>
    </StyledBox>
  );
}
