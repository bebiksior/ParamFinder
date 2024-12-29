import { Avatar, Button, Divider } from "@mui/material";
import { Link } from "@mui/material";
import { Typography } from "@mui/material";
import { Paper } from "@mui/material";
import { Box } from "@mui/material";
import StarIcon from '@mui/icons-material/Star';

export function About() {
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
          About ParamFinder
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<StarIcon />}
          href="https://github.com/bebiksior/ParamFinder"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
        >
          Star on GitHub
        </Button>
      </Box>
      <Typography variant="body1">
        <strong>ParamFinder</strong> is a Caido plugin designed to help you
        discover hidden parameters in web applications. You can find the source
        code on{" "}
        <Link
          href="https://github.com/bebiksior/ParamFinder"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </Link>
        .
      </Typography>
      <Typography variant="body1" sx={{ mt: 1 }}>
        Feel free to contribute to the project :D You can submit feature
        requests and report bugs via the GitHub issues page. I'm always looking
        for new ideas and improvements!
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="textSecondary">
        Your feedback and suggestions are always welcome. My X profile is{" "}
        <Link
          href="https://x.com/bebiksior"
          target="_blank"
          rel="noopener noreferrer"
        >
          bebiksior
        </Link>{" "}
        and my discord handle is <b>bebiks</b>
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
        <Avatar
          src="https://avatars.githubusercontent.com/u/71410238?v=4&size=30"
          alt="bebiks avatar"
          sx={{ mr: 1, width: 30, height: 30 }}
        />
        <Typography variant="body2">
          Made with ❤️ by{" "}
          <Link
            href="https://x.com/bebiksior"
            target="_blank"
            rel="noopener noreferrer"
          >
            bebiks
          </Link>
        </Typography>
      </Box>
    </Paper>
  )
}
