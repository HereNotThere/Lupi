import { EthIcon } from "./Icons";
import { Text } from "src/ui";
import styled from "styled-components";
import { getEthFromWei } from "src/utils/lupiUtils";
import { BigNumber } from "ethers";
import { TextProps } from "src/ui/Text/Text";

interface Props {
  wei?: BigNumber;
}

interface Props {
  eth?: number;
}

export const EthText = (props: TextProps & Props) => {
  const { eth, wei, ...textProps } = props;
  const value = eth ? eth : getEthFromWei(wei);
  return (
    <Text {...textProps}>
      {value}
      <InlineEth />
    </Text>
  );
};

const InlineEth = styled(EthIcon)`
  display: inline;
  height: 1em;
  margin-left: 0.1em;
  margin-bottom: -0.1em;
`;
