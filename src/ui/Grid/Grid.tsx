import { CSSProperties, useMemo } from "react";
import { Box, BoxProps } from "../Box/Box";
import "./Grid.scss";

interface GridProps extends BoxProps {
  columns: number;
}

export const Grid = (props: GridProps) => {
  const { columns, children, ...boxProps } = props;
  const style = useMemo(() => {
    return {
      "--grid-columns": columns,
    } as CSSProperties;
  }, [columns]);
  return (
    <Box className={`Grid`} gap={false} {...boxProps} style={style}>
      {children}
    </Box>
  );
};
