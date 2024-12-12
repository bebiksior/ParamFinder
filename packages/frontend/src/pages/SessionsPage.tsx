import { StyledBox } from "caido-material-ui";
import SessionTabs from "@/components/sessions/header/SessionTabs";
import SessionContent from "@/components/sessions/content/SessionContent";

export default function SessionsPage() {
  return (
    <StyledBox
      className="flex gap-1 flex-col"
      sx={{ backgroundColor: "transparent" }}
    >
      <SessionTabs />
      <SessionContent />
    </StyledBox>
  );
}
