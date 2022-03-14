import { useWeb3Context, WalletStatus } from "src/hooks/useWeb3";
import { Text } from "src/ui";
import { TextButton } from "src/ui/Button/Button";
import { TextProps } from "src/ui/Text/Text";
import { getShortAddress } from "src/utils/lupiUtils";

export const ConnectWallet = (props: { textProps?: TextProps }) => {
  const textProps = props.textProps ?? {};

  const { accounts, requestAccounts, walletStatus } = useWeb3Context();
  const shortAccounts = accounts.map(getShortAddress);

  return walletStatus === WalletStatus.Unlocked && !!shortAccounts.length ? (
    <Text align="right" textTransform="uppercase" color="muted" {...textProps}>
      <>{shortAccounts[0]}</>
    </Text>
  ) : (
    <TextButton
      onClick={() => requestAccounts()}
      color="primary"
      textTransform="uppercase"
      {...textProps}
    >
      Connect Wallet
    </TextButton>
  );
};
