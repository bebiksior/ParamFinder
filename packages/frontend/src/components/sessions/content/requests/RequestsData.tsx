import { StyledBox, StyledSplitter } from "caido-material-ui";
import { Tabs, Tab } from "@mui/material";
import RequestDetails from "./RequestDetails";
import { useUIStore } from "@/stores/uiStore";
import { VIEW_CATEGORIES } from "@/stores/uiStore";
import FindingsList from "./tables/FindingsList";
import RequestList from "./tables/RequestList";

export default function RequestsData() {
  const { activeCategory, setActiveCategory } = useUIStore();

  return (
    <StyledBox className="flex flex-col">
      <Tabs
        value={activeCategory}
        onChange={(_, newValue) => setActiveCategory(newValue)}
      >
        <Tab value={VIEW_CATEGORIES.REQUESTS} label="Requests" />
        <Tab value={VIEW_CATEGORIES.FINDINGS} label="Findings" />
      </Tabs>

      <StyledSplitter vertical>
        {activeCategory === VIEW_CATEGORIES.FINDINGS && <FindingsList />}
        {activeCategory === VIEW_CATEGORIES.REQUESTS && <RequestList />}
        <RequestDetails />
      </StyledSplitter>
    </StyledBox>
  );
}
