import { StyledSplitter } from "caido-material-ui";
import { EmptyPanel } from "../../common/EmptyPanel";
import SessionInfo from "./SessionInfo";
import RequestsData from "./requests/RequestsData";
import { useSessionsStore } from "@/stores/sessionsStore";

export default function SessionContent() {
  const activeSessionId = useSessionsStore(state => state.activeSessionId);
  if (!activeSessionId) return <EmptyPanel message="No session selected" />;

  return (
    <StyledSplitter>
      <SessionInfo />
      <RequestsData />
    </StyledSplitter>
  );
}
