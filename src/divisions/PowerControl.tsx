import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import {Box, Paper, Stack, Typography} from "@mui/material";
import theme from "../theme.ts";


interface NodesProps {
    nodes: NodeInformation[],
}

function LevitationConsumption() {
    return (
        <Paper sx={{
            padding: 1,
            backgroundColor: theme.palette.background.paper2,
        }}>
            <Stack direction="row" justifyContent={"space-between"} sx={{
                paddingLeft : 2,
                paddingRight : 2,
            }}>
                <Box>
                    <Typography> Levitation 1 </Typography>
                </Box>
                <Box>
                    TODO
                </Box>
                <Box>
                    <Typography textAlign="end"> 14kW </Typography>
                </Box>
            </Stack>
        </Paper>
    )
}

function PowerConsumption() {
    return (
        <Stack direction="row" spacing={2} alignItems="center" sx={{
            height: "100%",
            padding: 2,
        }}>
            <Stack direction="column" justifyContent={"start"} sx={{
                height: "100%",
                width: "100%",
            }} spacing={1}>
                <LevitationConsumption/>
                <LevitationConsumption/>
                <LevitationConsumption/>
                <LevitationConsumption/>
            </Stack>
        </Stack>
    )
}

function PowerControl({}: Readonly<NodesProps>) {
    return (
        <Stack direction="column" justifyContent="start" spacing={2} sx={{margin: 2}}>
            <Stack direction="row"
                   justifyItems="start"
                   spacing={2}>
                <Paper sx={{
                    width: "65%",
                    height: "89vh",
                    padding: 1,
                }}>
                    <Typography textAlign={"left"} paddingTop={1} paddingLeft={2}>
                        Power Consumption
                    </Typography>
                    <PowerConsumption/>

                </Paper>
                <Stack direction="column" spacing={1.2} justifyItems="start">
                    <Paper sx={{
                        width: "48vh",
                        height: "44vh",
                        padding: 1,
                    }}>
                        <Typography textAlign={"center"} paddingBottom={1}>
                            Speedometer
                        </Typography>
                    </Paper>
                    <Paper sx={{
                        width: "48vh",
                        height: "44vh",
                        padding: 1,
                    }}>
                        <Typography textAlign={"center"} paddingBottom={1}>
                            Fancy graph
                        </Typography>
                    </Paper>
                </Stack>
            </Stack>
        </Stack>
    );
}

export default PowerControl;
