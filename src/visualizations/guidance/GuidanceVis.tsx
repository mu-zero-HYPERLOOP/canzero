import "./GuidanceVis.css"
import {Box, List, ListItem, Stack, Typography} from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

function GuidanceVis() {

    return (
        <Stack>
            <Typography textAlign="center" paddingTop="0.5em" variant="h5">
                Guidance Position
            </Typography>
            <Stack direction="row" spacing={2} sx={{
                justifyContent: "space-evenly",
                marginRight : 2,
                marginLeft : 2,
            }}>
                <Box paddingTop="2.5em"><g id="guidance_vis">
                    <div className="outerSquare">
                    </div>
                    <div className="innerSquare">
                    </div>
                </g>
                </Box>
                <Typography textAlign="center" paddingTop="0.5em" variant="h5">
                    <List>
                        <ListItem>
                            <ListItemText primary="Distance from top: 5mm"/>
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Distance from left: 5mm"/>
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Distance from right: 5mm"/>
                        </ListItem>
                        <ListItem>
                            <ListItemText primary="Distance from bottom: 5mm"/>
                        </ListItem>
                    </List>
                </Typography>
            </Stack>
        </Stack>
    )
}


export default GuidanceVis;