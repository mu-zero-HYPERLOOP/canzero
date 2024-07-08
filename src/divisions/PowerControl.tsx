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
import PowerGraph from "./power/PowerGraph.tsx";
import useObjectEntryInfo from "../hooks/object_entry_info.ts";


interface NodesProps {
    nodes: NodeInformation[],
}

interface LevitationConsumptionProps {
    node: string,
    oe: string,
}

function LevitationConsumption({node, oe}: Readonly<LevitationConsumptionProps>) {
    const power = useObjectEntryValue(node, oe);
    const info = useObjectEntryInfo(node, oe);

    return (
        <Paper sx={{
            padding: 1,
            backgroundColor: theme.palette.background.paper2,
        }}>
            <Stack direction="row" justifyContent="right" sx={{
                paddingLeft : 2,
                paddingRight : 2,
                margin: 1,
            }}>
                <Box sx={{
                    width: "0%",
                }}>
                    <Typography> {oe === "total_power" ? node : oe} </Typography>
                </Box>
                <Box width="100%" textAlign="right">
                    <Stack direction="row" justifyContent="right">
                        <PowerVis value={power}/>
                        <Box>
                            <Typography textAlign="right" width="2.5vh"> {(power !== undefined) ? <Typography textAlign="end"> {power as number}{info?.unit} </Typography> : <Typography textAlign="end"> -{info?.unit} </Typography>} </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    )
}

function PowerConsumption() {
    return (
        <Stack direction="row" spacing={1} alignItems="center" sx={{
            height: "100%",
            paddingTop: 1,
        }}>
            <Stack direction="column" justifyContent={"start"} sx={{
                height: "100%",
                width: "100%",
            }} spacing={1}>
                <LevitationConsumption node={"power_board12"} oe={"total_power"}/>
                <LevitationConsumption node={"power_board24"} oe={"total_power"}/>
                <LevitationConsumption node={"input_board"} oe={"system_power_consumption"}/>
                <LevitationConsumption node={"power_board12"} oe={"levitation_boards_power_channel_current"}/>
                <LevitationConsumption node={"power_board12"} oe={"guidance_boards_power_channel_current"}/>
                <LevitationConsumption node={"power_board12"} oe={"motor_driver_power_channel_current"}/>
                <LevitationConsumption node={"power_board24"} oe={"sdc_signal_channel_current"}/>
                <LevitationConsumption node={"power_board24"} oe={"sdc_board_power_channel_current"}/>
                <LevitationConsumption node={"input_board"} oe={"communication_power_consumption"}/>
            </Stack>
        </Stack>
    )
}

function CommunicationPowerAnalogGauge() {
    const power = useObjectEntryValue("input_board", "communication_power_consumption");

    return (
        <>
            <Box paddingTop="1vh" textAlign="center" >
                <Speedometer
                    width={290}
                    value={(power !== undefined) ? (power as number) : 0}
                    max={400}
                    angle={160}
                    fontFamily='Arial'
                >
                    <Background angle={180} color="#000000"/>
                    <Arc/>
                    <Needle offset={40} circleRadius={30} circleColor={theme.palette.background.appBar}/>
                    <DangerPath/>
                    <Progress/>
                    <Marks step={50}/>
                    <Indicator color="#ffffff" y={95} x={130}>
                    </Indicator>
                </Speedometer>
            </Box><Typography marginTop="-235px" textAlign="center" fontSize="1.8em" marginLeft="50px" color="#ffffff">
            W
        </Typography>
        </>
    )
}

function SystemPowerAnalogGauge() {
    const power = useObjectEntryValue("input_board", "system_power_consumption");

    return (
        <>
            <Box paddingTop="1vh" textAlign="center" >
            <Speedometer
                width={290}
                value={(power !== undefined) ? (power as number) / 1000 : 0}
                max={6}
                angle={160}
                fontFamily='Arial'
            >
                <Background angle={180} color="#000000"/>
                <Arc/>
                <Needle offset={40} circleRadius={30} circleColor={theme.palette.background.appBar}/>
                <DangerPath/>
                <Progress/>
                <Marks step={1}/>
                <Indicator color="#ffffff" y={95} x={125}>
                </Indicator>
            </Speedometer>
        </Box><Typography marginTop="-235px" textAlign="center" fontSize="1.8em" marginLeft="55px" color="#ffffff">
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
                        Individual Power Consumption
                    </Typography>
                    <PowerConsumption/>

                </Paper>
                <Stack direction="column" spacing={1.2} justifyContent="space-evenly" width="35%">
                    <Paper sx={{
                        width: "100%",
                        height: "44vh",
                        paddingTop: 1,
                    }}>
                        <Typography textAlign={"center"} >
                            Total Power Consumption
                        </Typography>
                        <SystemPowerAnalogGauge/>
                        <Typography textAlign={"center"} paddingTop="7.5vh">
                            Communication Power Consumption
                        </Typography>
                        <CommunicationPowerAnalogGauge/>
                    </Paper>
                    <Paper sx={{
                        width: "100%",
                        height: "44vh",
                        padding: 1,
                    }}>
                        <Typography textAlign={"center"} paddingBottom={1}>
                            Power Consumption
                        </Typography>
                        <PowerGraph/>
                    </Paper>
                </Stack>
            </Stack>
        </Stack>
    );
}

export default PowerControl;
