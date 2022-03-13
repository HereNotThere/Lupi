import { useMediaQuery } from "react-responsive";

export const useResponsive = () => {
  const isSmall = useMediaQuery({ query: "(max-width: 1224px)" });

  return { isSmall };
};
