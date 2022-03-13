import { useMediaQuery } from "react-responsive";

export const useResponsive = () => {
  const isSmall = useMediaQuery({ query: "(max-width: 670px)" });
  return { isSmall };
};
