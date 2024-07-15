import { Stack, Typography } from "@mui/material";

function Link24Vis(){ 
  return (
    <Stack sx={{
      padding: 1
    }} direction="row" justifyContent="space-between">
      <Typography variant="body2">
        BatV : 24V
      </Typography>
      <Typography variant="body2">
        SupCap  : 24V
      </Typography>
      <Typography variant="body2">
        Link24Cur : 24V
      </Typography>
      <Typography variant="body2">
        Link45Cur : 24V
      </Typography>
    </Stack>
  );
}

export default Link24Vis;

