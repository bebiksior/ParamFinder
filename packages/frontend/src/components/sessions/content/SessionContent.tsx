import { miningSessionStore } from "@/stores/sessionsStore";
import { useStore } from "@nanostores/react";
import { StyledSplitter } from "caido-material-ui";
import { EmptyPanel } from "../../common/EmptyPanel";
import SessionInfo from "./SessionInfo";
import RequestsData from "./requests/RequestsData";

export default function SessionContent() {
  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  if (!activeSessionId) return <EmptyPanel message="No session selected" />;

  return (
    <StyledSplitter>
      <SessionInfo />
      <RequestsData />
    </StyledSplitter>
  );
}
