import { HTTPEditor } from "@/components/common/HTTPEditor";
import { useStore } from "@nanostores/react";
import { miningSessionStore } from "@/stores/sessionsStore";
import { StyledSplitter } from "caido-material-ui";
import { EmptyPanel } from "@/components/common/EmptyPanel";

export default function RequestsDetails() {
  const activeSessionId = useStore(miningSessionStore.activeSessionId);
  const uiState = useStore(miningSessionStore.uiState);
  const selectedRequest = miningSessionStore.getRequest(activeSessionId ?? "", uiState.selectedRequestId ?? "");

  if (!selectedRequest) return <EmptyPanel message="No request selected" />;

  return <StyledSplitter>
    <HTTPEditor value={selectedRequest?.requestResponse.request.raw} type="request" />
    <HTTPEditor value={selectedRequest?.requestResponse.response.raw} type="response" />
  </StyledSplitter>
}
