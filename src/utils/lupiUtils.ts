export const getShortAddress = (address?: string | undefined) => {
  return address && address.length > 16
    ? `${address.slice(0, 5)}..${address.slice(-4)}`
    : address;
};
