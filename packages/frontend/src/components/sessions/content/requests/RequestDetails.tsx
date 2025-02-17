import { HTTPEditor } from "@/components/common/HTTPEditor";
import { StyledSplitter } from "caido-material-ui";
import { EmptyPanel } from "@/components/common/EmptyPanel";
import { useUIStore } from "@/stores/uiStore";
import { useSessionsStore } from "@/stores/sessionsStore";
import { useShallow } from "zustand/shallow";

export default function RequestDetails() {
  const activeSessionId = useSessionsStore((state) => state.activeSessionId);
  const selectedRequestId = useUIStore((state) => state.selectedRequestId);
  const selectedRequestResponse = useSessionsStore(
    useShallow((state) => {
      if (!activeSessionId || !state.sessions[activeSessionId]) return null;
      const session = state.sessions[activeSessionId];

      const findingRequest = session.findings.find(
        (finding) => finding.requestResponse?.request.id === selectedRequestId,
      )?.requestResponse;
      if (findingRequest) return findingRequest;

      return session.sentRequests.find(
        (req) => req.requestResponse?.request.id === selectedRequestId,
      )?.requestResponse;
    }),
  );

  if (!selectedRequestResponse) {
    return <EmptyPanel message="No request selected" />;
  }

  return (
    <StyledSplitter>
      <HTTPEditor
        value={selectedRequestResponse.request.raw || ""}
        type="request"
        host={selectedRequestResponse.request.host}
        port={selectedRequestResponse.request.port}
        isTls={selectedRequestResponse.request.tls}
      />
      <HTTPEditor
        value={selectedRequestResponse.response.raw || ""}
        type="response"
      />
    </StyledSplitter>
  );
}
