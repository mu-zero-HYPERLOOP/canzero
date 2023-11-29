import { Switch, Stack, Typography } from "@mui/material";
import { useState } from "react";

interface FrameTimeProps {
  timestamp: number,
  deltaTime: number,
}

function FrameTime({ timestamp, deltaTime }: FrameTimeProps) {
  const [absoluteTime, setAbsoluteTime] = useState(true);


  return (<>
    {absoluteTime ? <p> {timestamp} ms </p> : <p> {deltaTime} &mu;s </p>}
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography>abs.</Typography>
      <Switch onChange={() => setAbsoluteTime((absoluteTime) => !absoluteTime)}
        size="small" sx={{
          '& .MuiSwitch-switchBase.Mui-checked': {
              '&+.MuiSwitch-track': {
              opacity: 1,
              backgroundColor: 'white',
            }
          },
          '& .MuiSwitch-track': {
            opacity: 1,
            backgroundColor: 'white',
          },
          '& .MuiSwitch-thumb': {
            backgroundColor: '#00d6ba'
          },
        }} />
      <Typography>rel.</Typography>
    </Stack>

  </>);



}

export default FrameTime;
