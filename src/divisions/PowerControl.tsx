import {NodeInformation} from "../nodes/types/NodeInformation.ts";
import {Box, Paper, Stack, Typography} from "@mui/material";
import theme from "../theme.ts";
import Speedometer, {Arc, Background, DangerPath, Indicator, Marks, Needle, Progress,} from 'react-speedometer';
import PowerVis from "../visualizations/power/PowerVis.tsx";
import useObjectEntryValue from "../hooks/object_entry_value.ts";
import PowerGraph from "./power/PowerGraph.tsx";
import useObjectEntryInfo from "../hooks/object_entry_info.ts";
import {getMax, getMin} from "../object_entry/types/ObjectEntryInformation.tsx";


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

    let min: number = getMin(info)
    let max: number = getMax(info)


    return (
        <Paper sx={{
            paddingTop: 1,
            paddingBottom: 1,
            padding: 1,
            backgroundColor: theme.palette.background.paper2,
        }}>
            <Stack direction="row" justifyContent="space-between" sx={{
                paddingLeft: 1,
                margin: 0.75,
            }}>
                <Typography width="31vh"> {oe === "total_power" ? node : oe} </Typography>
                <PowerVis value={power} min={min} max={max} firstThreshold={0.1 * max} secondThreshold={0.8 * max}/>
                {(power !== undefined) ?
                    <Typography width="6vh" textAlign="right"> {power as number}{info?.unit} </Typography> :
                    <Typography width="6vh" textAlign="right"> -{info?.unit} </Typography>}
            </Stack>
        </Paper>
    )
}

function PowerConsumption() {
    return (
        <Stack direction="row" alignItems="center" sx={{
            height: "100%",
            paddingTop: 1,
        }}>
            <Stack direction="column" justifyContent={"start"} sx={{
                height: "100%",
                width: "100%",
            }} spacing={0.8}>
                <LevitationConsumption node={"power_board12"} oe={"total_power"}/>
                <LevitationConsumption node={"power_board24"} oe={"total_power"}/>
                <LevitationConsumption node={"power_board12"} oe={"levitation_boards_power_channel_current"}/>
                <LevitationConsumption node={"power_board12"} oe={"guidance_boards_power_channel_current"}/>
                <LevitationConsumption node={"power_board12"} oe={"motor_driver_power_channel_current"}/>
                <LevitationConsumption node={"power_board24"} oe={"sdc_signal_channel_current"}/>
                <LevitationConsumption node={"power_board24"} oe={"sdc_board_power_channel_current"}/>
            </Stack>
        </Stack>
    )
}

function CommunicationPowerAnalogGauge() {
    const power = useObjectEntryValue("input_board", "communication_power_consumption");

    return (
        <>
            <Box paddingTop="1vh" textAlign="right" paddingRight="2vh">
                <Speedometer
                    width={240}
                    value={(power !== undefined) ? (power as number) : 0}
                    max={400}
                    angle={160}
                    fontFamily='Arial'
                >
                    <Background angle={180} color="#000000"/>
                    <Arc/>
                    <Needle offset={40} circleRadius={25} circleColor={theme.palette.background.appBar}/>
                    <DangerPath/>
                    <Progress/>
                    <Marks step={50}/>
                    <Indicator color="#ffffff" y={85} x={100} fontSize={35}>
                    </Indicator>
                </Speedometer>
            </Box><Typography marginTop="-18vh" textAlign="right" fontSize="1.6em" marginRight="10vh" color="#ffffff">
            W
        </Typography>
        </>
    )
}

function SystemPowerAnalogGauge() {
    const power = useObjectEntryValue("input_board", "system_power_consumption");

    return (
        <>
            <Box paddingTop="1vh" paddingLeft="2vh">
                <Speedometer
                    width={280}
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
                    <Indicator color="#ffffff" y={95} x={120}>
                    </Indicator>
                </Speedometer>
            </Box><Typography marginTop="-21vh" textAlign="left" fontSize="1.8em" marginLeft="16vh" color="#ffffff">
            kW
        </Typography>
        </>
    )
}

function PowerControl({}: Readonly<NodesProps>) {
    return (
        <Stack direction="column" spacing={2} sx={{margin: 2}}>
            <Stack direction="row"
                   justifyContent="space-evenly"
                   spacing={2}>
                <Paper sx={{
                    width: "65%",
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
                        height: "100%",
                        paddingTop: 1,
                    }}>
                        <Typography paddingLeft="6vh">
                            Total Power Consumption
                        </Typography>
                        <SystemPowerAnalogGauge/>
                        <Typography textAlign="right" paddingRight="2vh" paddingTop="7.5vh">
                            Communication Power Consumption
                        </Typography>
                        <CommunicationPowerAnalogGauge/>
                    </Paper>
                </Stack>
            </Stack>
            <Paper sx={{
                width: "100%",
                paddingTop: 2,
            }}>
                <Typography textAlign={"center"} paddingBottom={1}>
                    Power Consumptions
                </Typography>
                <PowerGraph/>
            </Paper>
        </Stack>
    );
}

export default PowerControl;
