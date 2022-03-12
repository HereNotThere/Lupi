import { Box, Text } from "src/ui";
import styled from "styled-components";
import { EmailIcon, GitHubIcon, TwitterIcon } from "./Icons";

export const Footer = () => (
  <Box grow color="muted" gap="sm" padding alignItems="center">
    <Box>
      <Text small>
        An experiment by <a href="https://hntlabs.com/">Here Not There Labs</a>
      </Text>
    </Box>
    <Box row gap="md">
      <Text>
        <a href="https://github.com/HereNotThere/Lupi" title="GitHub">
          <InlineGitHubIcon />
        </a>
      </Text>
      <Text>
        <a href="https://twitter.com/hntlabs" title="Twitter">
          <InlineTwitterIcon />
        </a>
      </Text>
      <Text>
        <a href="mailto:hello@hntlabs.com?subject=LUPI" title="Email">
          <InlineEmailIcon />
        </a>
      </Text>
    </Box>
  </Box>
);

const InlineGitHubIcon = styled(GitHubIcon)`
  display: inline;
  height: 1.1em;
`;

const InlineTwitterIcon = styled(TwitterIcon)`
  display: inline;
  height: 1.1em;
`;

const InlineEmailIcon = styled(EmailIcon)`
  display: inline;
  height: 1.1em;
`;
