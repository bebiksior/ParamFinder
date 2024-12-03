import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import { caidoTheme, StyledSplitter, StyledBox } from "caido-material-ui";
import { Typography } from "@mui/material";
import "allotment/dist/style.css";
import "./styles/style.css";

export const App = () => {
  return (
    <ThemeProvider theme={caidoTheme}>
      <StyledSplitter>
        <StyledBox className="p-5">
          <Typography variant="h5">Hello World</Typography>
        </StyledBox>
        <StyledSplitter vertical>
          <StyledBox className="p-5">
            <Typography variant="h5">Caido is awesome</Typography>
          </StyledBox>
          <StyledBox className="p-5">
            <Typography variant="h5">Have a great day!</Typography>
          </StyledBox>
        </StyledSplitter>
      </StyledSplitter>
    </ThemeProvider>
  );
};
