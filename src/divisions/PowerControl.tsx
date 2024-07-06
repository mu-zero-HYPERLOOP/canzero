import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import {Box, Paper, Stack, Typography} from "@mui/material";
import theme from "../theme.ts";
import Speedometer, {
    Background,
    Arc,
    Needle,
    Progress,
    Marks,
    DangerPath,
    Indicator,
} from 'react-speedometer';
import PowerVis from "../visualizations/power/PowerVis.tsx";
import useObjectEntryValue from "../hooks/object_entry_value.ts";


interface NodesProps {
    nodes: NodeInformation[],
}

interface LevitationConsumptionProps {
    node: string,
    oe: string,
}

function LevitationConsumption({node, oe}: Readonly<LevitationConsumptionProps>) {
    const power = useObjectEntryValue(node, oe);
    return (
        <Paper sx={{
            padding: 1,
            backgroundColor: theme.palette.background.paper2,
        }}>
            <Stack direction="row" justifyContent="space-between" sx={{
                paddingLeft : 2,
                paddingRight : 2,
                margin: 1,
            }}>
                <Box sx={{
                    width: "0%",
                }}>
                    <Typography> {node}::{oe} </Typography>
                </Box>
                <Box width="100%" textAlign="right">
                    <Stack direction="row" justifyContent="right">
                        <PowerVis/>
                        <Box>
                            <Typography textAlign="end"> {(power !== undefined) ? <Typography textAlign="end"> {power as number}W </Typography> : <Typography textAlign="end"> -W </Typography>} </Typography>
                        </Box>
                    </Stack>
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
                <LevitationConsumption node={"power_board12"} oe={"total_power"}/>
                <LevitationConsumption node={"power_board24"} oe={"total_power"}/>
                <LevitationConsumption node={"input_board"} oe={"system_power_consumption"}/>
            </Stack>
        </Stack>
    )
}

function AnalogGauge() {
    const power = useObjectEntryValue("input_board", "system_power_consumption");

    return (
        <>
            <Box paddingTop="4vh" textAlign="center">
            <Speedometer
                width={400}
                value={(power !== undefined) ? (power as number) / 1000 : 0}
                max={5}
                angle={160}
                fontFamily='Arial'
            >
                <Background angle={180} color="#000000"/>
                <Arc/>
                <Needle offset={40} circleRadius={30} circleColor={theme.palette.background.appBar}/>
                <DangerPath/>
                <Progress/>
                <Marks step={1}/>
                <Indicator color="#000000" y={280} x={175}>
                </Indicator>
            </Speedometer>
        </Box><Typography marginTop="-170px" textAlign="center" fontSize="2.5em" marginLeft="70px">
            kW
        </Typography>
        </>
    )

}

function PowerControl({}: Readonly<NodesProps>) {
    return (
        <Stack direction="column" sx={{margin: 2}}>
            <Stack direction="row"
                   justifyContent="space-evenly"
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
                <Stack direction="column" spacing={1.2} justifyContent="space-evenly" width="35%">
                    <Paper sx={{
                        width: "100%",
                        height: "44vh",
                        padding: 1,
                    }}>
                        <Typography textAlign={"center"} paddingBottom={1}>
                            Consumption
                        </Typography>
                        <AnalogGauge/>
                    </Paper>
                    <Paper sx={{
                        width: "100%",
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
