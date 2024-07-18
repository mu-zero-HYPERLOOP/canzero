import { Button, List, Paper, Stack, Typography, useTheme } from "@mui/material";
import useCanzeroErrors from "../../../hooks/canzero_errors";
import ErrorListItem from "./ErrorListItem";
import { ErrorEvent } from "../../types/events/ErrorEvent";
import { invoke } from "@tauri-apps/api";


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
      <Stack direction="row" justifyContent="space-evenly" alignItems="center">
        <Typography textAlign="center" paddingTop="0.5em" paddingBottom="0.5em" variant="h6">
          Errors
        </Typography>
        <Button sx={{
          height: "50%",
        }} onClick={()=>{
          invoke("reset_errors").catch(console.error);
        } }>
          Reset
        </Button>
      </Stack>
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

