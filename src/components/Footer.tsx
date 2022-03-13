import { useResponsive } from "src/hooks/useResponsive";
import { Box, Text } from "src/ui";
import { TextButton } from "src/ui/Button/Button";
import styled from "styled-components";
import { EmailIcon, GitHubIcon, TwitterIcon } from "./Icons";

type Props = {
  onSelectMenuItem: (menuId: string) => void;
};

export const Footer = (props: Props) => {
  const { isSmall } = useResponsive();
  return (
    <>
      {isSmall && (
        <Box
          grow
          color="muted"
          gap="sm"
          padding="md"
          alignItems="center"
          border
          borderRadius
        >
          <TextButton
            color="text"
            size="regular"
            onClick={() => props.onSelectMenuItem("how-to-play")}
          >
            HOW TO PLAY
          </TextButton>
          <TextButton
            color="text"
            size="regular"
            onClick={() => props.onSelectMenuItem("past-games")}
          >
            PAST LUPIS
          </TextButton>
        </Box>
      )}
      <Box grow color="muted" gap="sm" padding alignItems="center">
        <Box>
          <Text small>
            An experiment by{" "}
            <a href="https://hntlabs.com/">Here Not There Labs</a>
          </Text>
        </Box>
        <Box row gap="md">
          <Text>
            <a href="https://github.com/HereNotThere" title="GitHub">
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
    </>
  );
};

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
