import { Typography } from "@mui/material";
import { StyledBox } from "caido-material-ui";

export const EmptyPanel: React.FC<{ message: string }> = ({ message }) => {
  return (
    <StyledBox className="flex flex-col items-center justify-center h-full">
      <Typography variant="body1" className="text-gray-500">
        {message}
      </Typography>
    </StyledBox>
  );
};
