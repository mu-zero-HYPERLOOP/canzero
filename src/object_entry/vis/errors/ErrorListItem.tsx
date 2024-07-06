import { ListItem, ListItemIcon, ListItemText, Stack, Tooltip, Typography, useTheme } from "@mui/material";

import CancelIcon from '@mui/icons-material/Cancel';
import FeedbackIcon from '@mui/icons-material/Feedback';
import WarningIcon from '@mui/icons-material/Warning';
import useObjectEntryValue from "../../../hooks/object_entry_value";
import useObjectEntryInfo from "../../../hooks/object_entry_info";
import { ErrorEvent, Friend } from "../../types/events/ErrorEvent";



interface ErrorListItemProps {
  event : ErrorEvent
}

interface FriendItemProps {
  friend : Friend,
}

function FriendItem({friend} : Readonly<FriendItemProps>) {
  const value = useObjectEntryValue(friend.node_name, friend.object_entry_name);
  const info = useObjectEntryInfo(friend.node_name, friend.object_entry_name);

  if (value == undefined) {
    return <></>;
  }else {
    return <Typography>{`${value} ${(info?.unit !== undefined && info?.unit !== null) ? info.unit : ""}`}</Typography>

  }
}

function ErrorListItem({
  event
}: Readonly<ErrorListItemProps>) {
  const theme = useTheme();

  let backgroundColor;
  let icon;
  switch (event.level) {
    case "OK":
    case "INFO":
      backgroundColor = "lightblue";
      icon = <FeedbackIcon sx={{
        fontSize: "1em",
        color: "blue",
      }} />
      break;
    case "WARNING":
      backgroundColor = theme.palette.background.warn;
      icon = <WarningIcon sx={{
        fontSize: "1em",
        color: "orange",
      }} />
      break;
    case "ERROR":
      backgroundColor = theme.palette.background.error;
      icon = <CancelIcon sx={{
        fontSize: "1em",
        color: "red",
      }}
      />
      break;
  }

  return (
    <Tooltip title={event.description} placement="top">
      <ListItem sx={{
        padding: 0,
        marginLeft: 0,
        marginRight: 0,
        marginTop: "1px",
        width: "100%",
        backgroundColor: backgroundColor,
        opacity: event.deprecated ? 0.25 : 1
      }}
        secondaryAction={
          <ListItemText>
             {(event.friend !== undefined && event.friend !== null) ? <FriendItem friend={event.friend}/> : <></>}
          </ListItemText>
        }
      >
        <ListItemIcon sx={{
          width: "1em",
          minWidth: "1.5em",
          maxWidth: "1.5em",
          marginLeft: 1,
        }}>
          {icon}
        </ListItemIcon>
        <Stack direction="row" justifyContent="start">
          <ListItemText sx={{
            width: "5em",
          }}
            primaryTypographyProps={{
              padding: 0,
              fontSize: "0.8em",

            }}
          >
            {event.timestamp}
          </ListItemText>
          <ListItemText
            primaryTypographyProps={{
              padding: 0,
              fontSize: "0.8em",

            }}
          >
            {event.label}
          </ListItemText>
        </Stack>
      </ListItem>
    </Tooltip>
  );

}

export default ErrorListItem;
