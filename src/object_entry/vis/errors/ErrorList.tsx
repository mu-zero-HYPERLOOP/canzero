import { List, Paper, Typography, useTheme } from "@mui/material";
import useCanzeroErrors from "../../../hooks/canzero_errors";
import ErrorListItem from "./ErrorListItem";
import { ErrorEvent } from "../../types/events/ErrorEvent";


interface ErrorListProps {
  width?: string,
  height?: string,
}

function ErrorList({ width, height }: Readonly<ErrorListProps>) {
  const theme = useTheme();

  const errors = useCanzeroErrors();
  console.log(errors);

  return (
    <Paper component="div" sx={{
      width,
      height,
    }}>
      <Typography textAlign="center" paddingTop="0.5em" paddingBottom="0.5em" variant="h6">
        Errors
      </Typography>
      <Paper sx={{
        backgroundColor: theme.palette.background.paper2,
        marginLeft: "0.5em", marginRight: "0.5em",
        marginBottom: "0.5em",
        overflow: "auto",
        height: `calc(${height} - 65px)`,
      }}>
        <List sx={{
          padding: 0,
          margin: 0,
        }}>
          { errors.map((error: ErrorEvent) => <ErrorListItem event={error} />) }
        </List>
      </Paper>
    </Paper>
  );
}

export default ErrorList;

