import { About } from "@/components/containers/About";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Divider,
  Skeleton,
  Avatar,
} from "@mui/material";
import { StyledBox } from "caido-material-ui";
import { useState, useEffect } from "react";

interface Sponsor {
  username: string;
  avatar: string;
}

interface SponsorsResponse {
  status: string;
  sponsors: {
    current: Sponsor[];
    past: Sponsor[] | null;
  };
}

interface StartMethodProps {
  title: string;
  description: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  maxWidth?: number;
  scaleHover?: number;
  imagePosition?: "left top" | "right top" | "center top";
  children?: React.ReactNode;
}
function StartMethod({
  title,
  description,
  imageSrc,
  imageAlt,
  maxWidth = 300,
  scaleHover = 2,
  children,
}: StartMethodProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [transformOrigin, setTransformOrigin] = useState("left top");

  const handleMouseEnter = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const spaceOnLeft = rect.left;
    const spaceOnRight = windowWidth - rect.right;

    if (spaceOnRight < spaceOnLeft) {
      setTransformOrigin("right top");
    } else {
      setTransformOrigin("left top");
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{ p: 2, bgcolor: "background.paper", flex: "1 1 300px" }}
    >
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 500, mb: 1 }}
        fontWeight="bold"
        fontSize={16}
      >
        {title}
      </Typography>
      <Typography sx={{ lineHeight: 1.6, mb: children ? 2 : 0 }}>
        {description}
      </Typography>
      {children}
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={200}
          sx={{
            maxWidth: `${maxWidth}px`,
            borderRadius: 1,
            mt: 2,
          }}
        />
      )}
      <Box
        component="img"
        src={imageSrc}
        alt={imageAlt}
        onLoad={() => setIsLoading(false)}
        onMouseEnter={handleMouseEnter}
        sx={{
          width: "100%",
          maxWidth: `${maxWidth}px`,
          borderRadius: 1,
          mt: 2,
          transition: "all 0.3s ease",
          cursor: "pointer",
          willChange: "transform",
          position: "relative",
          display: isLoading ? "none" : "block",
          "&:hover": {
            transform: `scale(${scaleHover})`,
            transformOrigin,
            zIndex: 1000,
          },
        }}
      />
    </Paper>
  );
}

interface GettingStartedStepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

function GettingStartedStep({
  number,
  title,
  children,
}: GettingStartedStepProps) {
  return (
    <div>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        {number}. {title}
      </Typography>
      {children}
    </div>
  );
}

function Sponsors() {
  const [sponsorList, setSponsorList] = useState<Sponsor[]>([]);
  const [isSponsorsLoading, setIsSponsorsLoading] = useState(true);

  useEffect(() => {
    async function loadSponsors() {
      try {
        const response = await fetch(
          "https://gh-sponsors-api-seven.vercel.app/v3/sponsors/bebiksior"
        );
        const data: SponsorsResponse = await response.json();
        if (data.status === "success" && data.sponsors.current) {
          setSponsorList(data.sponsors.current);
        }
      } catch (error) {
        console.error("Failed to fetch sponsors:", error);
      } finally {
        setIsSponsorsLoading(false);
      }
    }

    loadSponsors();
  }, []);

  return (
    <section>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: "primary.main", fontWeight: 500, mb: 1 }}
      >
        Sponsors
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
        <Paper sx={{ p: 2 }}>
          {isSponsorsLoading ? (
            <Stack direction="row" spacing={1} bgcolor="transparent">
              {[1, 2, 3, 4].map((index) => (
                <Skeleton key={index} variant="circular" width={40} height={40} />
              ))}
            </Stack>
          ) : sponsorList.length ? (
            <Stack direction="row" spacing={3} bgcolor="transparent">
              {sponsorList.map(({ username, avatar }) => (
                <Stack
                  key={username}
                  alignItems="center"
                  spacing={0.5}
                  sx={{ bgcolor: "transparent" }}
                >
                  <Avatar alt={username} src={avatar} sx={{ width: 40, height: 40 }} />
                  <Typography variant="caption" color="text.secondary">
                    @{username}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No sponsors yet
            </Typography>
          )}
        </Paper>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Thank you to all my amazing sponsors! Your support helps keep this project
        going and motivates me to add new features.
      </Typography>

      <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'primary.main' }}>
        Special thanks to <a href="https://www.criticalthinkingpodcast.io/" target="_blank" rel="noopener noreferrer" style={{color: 'inherit', textDecoration: 'underline'}}>Critical Thinking Bug Bounty Podcast</a> for their continuous support across all my projects!
      </Typography>
    </section>
  );
}

export function UsagePage() {
  const isMac = navigator.platform.toLowerCase().includes("mac");
  const shortcut = isMac ? "⌘ + ⇧ + E" : "Ctrl + Shift + E";

  return (
    <StyledBox
      padding={3}
      className="overflow-y-auto overflow-x-hidden"
      sx={{ userSelect: "text" }}
    >
      <Stack spacing={4} divider={<Divider />} sx={{ bgcolor: "transparent" }}>
        <About />
        <Sponsors />
        <section>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: 500, mb: 1 }}
          >
            Ways to Start
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <StartMethod
              title="Quick Menu Shortcut"
              description={`The fastest way to start ParamFinder is using the keyboard shortcut (customizable in Caido Settings → Shortcuts):`}
              imageSrc="https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/QuickMenu.gif"
              imageAlt="Quick Menu usage demonstration"
              maxWidth={400}
              scaleHover={1.5}
            >
              <Typography
                sx={{
                  p: 2,
                  bgcolor: "grey.900",
                  color: "common.white",
                  borderRadius: 1,
                  fontFamily: "monospace",
                  display: "inline-block",
                }}
              >
                {shortcut}
              </Typography>
            </StartMethod>

            <StartMethod
              title="Command Palette"
              description="Open Caido's command palette and type 'Param Finder' to see available commands:"
              imageSrc="https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/CommandPalette.gif"
              imageAlt="Command palette usage demonstration"
              maxWidth={600}
              scaleHover={1.5}
            >
              <Stack
                component="ul"
                spacing={0.5}
                sx={{ pl: 2, mt: 1, bgcolor: "transparent" }}
              >
                {[
                  ["QUERY", "Discover parameters in URL query string"],
                  ["BODY", "Find parameters in request body"],
                  ["HEADERS", "Search for header parameters"],
                ].map(([type, desc]) => (
                  <Typography
                    key={type}
                    component="li"
                    sx={{ lineHeight: 1.6 }}
                  >
                    <strong>Param Finder [{type}]</strong> - {desc}
                  </Typography>
                ))}
              </Stack>
            </StartMethod>

            <StartMethod
              title="Context Menu"
              description="Right-click on any request in Caido to start parameter discovery from the context menu."
              imageSrc="https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/ContextMenu.gif"
              imageAlt="Context menu usage demonstration"
              scaleHover={1.5}
            />

            <StartMethod
              title="Custom Shortcuts"
              description="You can create custom shortcuts for ParamFinder actions in Caido Settings → Shortcuts."
              imageSrc="https://raw.githubusercontent.com/bebiksior/ParamFinder/refs/heads/main/assets/CustomShortcuts.gif"
              imageAlt="Custom shortcuts usage demonstration"
              scaleHover={2.5}
              maxWidth={500}
            />
          </Box>
        </section>

        <section>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: "primary.main", fontWeight: 500, mb: 1 }}
          >
            Getting Started
          </Typography>
          <Paper sx={{ p: 4, borderRadius: 2 }}>
            <Stack spacing={3} sx={{ bgcolor: "transparent" }}>
              <GettingStartedStep number={1} title="Upload a Wordlist">
                <Typography sx={{ lineHeight: 1.8, color: "text.secondary" }}>
                  Before starting, make sure you have at least one wordlist
                  uploaded and enabled in ParamFinder settings. The wordlist
                  should contain potential parameter names to test.
                </Typography>
              </GettingStartedStep>

              <GettingStartedStep number={2} title="Select a Request">
                <Typography sx={{ lineHeight: 1.8, color: "text.secondary" }}>
                  Choose a request from your Caido history that you want to test
                  for hidden parameters. This will be your base request for
                  parameter discovery.
                </Typography>
              </GettingStartedStep>

              <GettingStartedStep number={3} title="Choose Attack Type">
                <Typography sx={{ lineHeight: 1.8, color: "text.secondary" }}>
                  Select where to look for parameters:
                </Typography>
                <Stack
                  component="ul"
                  spacing={1}
                  sx={{
                    pl: 2,
                    mt: 1.5,
                    bgcolor: "transparent",
                  }}
                >
                  {[
                    ["QUERY", "Tests parameters in the URL query string"],
                    [
                      "BODY",
                      "Tests parameters in the request body (JSON or URL-encoded)",
                    ],
                    ["HEADERS", "Tests for custom header parameters"],
                  ].map(([type, desc]) => (
                    <Typography
                      key={type}
                      component="li"
                      sx={{ lineHeight: 1.8, color: "text.secondary" }}
                    >
                      <strong style={{ color: "text.primary" }}>{type}</strong>{" "}
                      - {desc}
                    </Typography>
                  ))}
                </Stack>
              </GettingStartedStep>

              <GettingStartedStep number={4} title="Monitor Progress">
                <Typography sx={{ lineHeight: 1.8, color: "text.secondary" }}>
                  ParamFinder will start testing parameters and show results in
                  real-time. You can:
                </Typography>
                <Stack
                  component="ul"
                  spacing={1}
                  sx={{
                    pl: 2,
                    mt: 1.5,
                    bgcolor: "transparent",
                  }}
                >
                  {[
                    "View discovered parameters in the Findings section",
                    "Copy or export found parameters",
                    "Pause/Resume or Cancel the discovery process",
                  ].map((text) => (
                    <Typography
                      key={text}
                      component="li"
                      sx={{ lineHeight: 1.8, color: "text.secondary" }}
                    >
                      {text}
                    </Typography>
                  ))}
                </Stack>
              </GettingStartedStep>
            </Stack>
          </Paper>
        </section>
      </Stack>
    </StyledBox>
  );
}
