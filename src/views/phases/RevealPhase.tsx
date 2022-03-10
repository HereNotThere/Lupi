import React, { useCallback, useEffect, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { BigGreenButton } from "src/components/Buttons";
import { GameStats } from "src/components/GameStats";
import { Spinner } from "src/components/Spinner";
import { TicketStack } from "src/components/TicketStack";
import { useLupiContractContext } from "src/hooks/useLupiContract";
import { useTicketList, useTickets } from "src/hooks/useTickets";
import { Box, Grid, Text } from "src/ui";
import { isValidTicket } from "src/utils/lupiUtils";
import styled from "styled-components";

export const RevealPhase = () => {
  const { round, revealGuesses, guessHashes, revealGuessesState } =
    useLupiContractContext();
  const ticketList = useTicketList(guessHashes);
  const revealAll = useCallback(async () => {
    await revealGuesses(ticketList);
  }, [revealGuesses, ticketList]);

  const isChecking = revealGuessesState.type === "Running";
  const submitText = !isChecking
    ? `Check ${ticketList.length > 1 ? ticketList.length : ""} ticket${
        ticketList.length > 1 ? "s" : ""
      }`
    : "";
  return (
    <Grid columns={2} grow>
      {/* left column */}
      <Box centerContent>
        <Grid columns={1} gap="md">
          <Text header="large" align="center">
            Round {round}
          </Text>
          <GameStats />
        </Grid>
      </Box>
      {/* right column */}
      <Box grow centerContent gap="lg">
        {!ticketList.length ? (
          <>
            <Text header="large">{"Check if you are the LUPI"}</Text>
            <TicketDragAndDrop>{`Drop round #${round} tickets here`}</TicketDragAndDrop>
          </>
        ) : (
          <>
            <TicketStack tickets={ticketList} />
            <BigGreenButton
              centerContent
              onClick={revealAll}
              icon={isChecking && <Spinner />}
            >
              {submitText}
            </BigGreenButton>
          </>
        )}
      </Box>
    </Grid>
  );
};

export const TicketDragAndDrop: React.FC = (props) => {
  const { storeTicket } = useTickets();
  const [file, setFile] = useState<Blob>();

  const handleChange = (file: Blob) => {
    setFile(file);
  };
  useEffect(() => {
    if (!file) {
      return;
    }

    const onLoad = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      const jsonData = typeof result === "string" && JSON.parse(result);

      if (Array.isArray(jsonData)) {
        const tickets = jsonData.filter(isValidTicket);
        if (tickets.length) {
          tickets.forEach(storeTicket);
        }
      }
    };

    const reader = new FileReader();
    reader.addEventListener("load", onLoad);
    reader.readAsText(file);

    return () => {
      reader.removeEventListener("load", onLoad);
    };
  }, [file, storeTicket]);

  return (
    <FileUploader
      handleChange={handleChange}
      name="file"
      types={["JSON"]}
      children={
        <DragAndDropBox
          borderRadius="lg"
          centerContent
          padding="lg"
          color="primary"
        >
          <Text header="large" align="center">
            {props.children ?? "Drop tickets here"}
          </Text>
        </DragAndDropBox>
      }
    />
  );
};

const DragAndDropBox = styled(Box)`
  cursor: pointer;
  border: 4px dashed currentColor;
`;
