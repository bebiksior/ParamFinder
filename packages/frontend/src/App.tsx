import React, { useState } from "react";
import { CircularProgress, ThemeProvider } from "@mui/material"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SessionsPage from "./pages/SessionsPage";
import SettingsPage from "./pages/SettingsPage";
import WordlistsPage from "./pages/WordlistsPage";
import { caidoTheme } from "caido-material-ui";
import "allotment/dist/style.css";
import "./styles/style.css";
import Header from "./components/containers/Header";
import { usePageData } from './hooks/usePageData';

const queryClient = new QueryClient();

export default function App() {
  const [activeComponent, setActiveComponent] = useState("Sessions");
  const { isLoading } = usePageData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <CircularProgress />
      </div>
    );
  }

  const renderComponent = () => {
    switch (activeComponent) {
      case "Sessions":
        return <SessionsPage />;
      case "Wordlists":
        return <WordlistsPage />;
      case "Settings":
        return <SettingsPage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={caidoTheme}>
        <div className="h-full flex flex-col gap-1">
          <Header
            activeComponent={activeComponent}
            setActiveComponent={setActiveComponent}
          />
          {renderComponent()}
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
