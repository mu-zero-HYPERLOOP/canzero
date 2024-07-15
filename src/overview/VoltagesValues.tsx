import {Paper, Stack, Typography, useTheme} from "@mui/material";
import useObjectEntryValue from "../hooks/object_entry_value.ts";
import useObjectEntryInfo from "../hooks/object_entry_info.ts";
import {getMax, getMin} from "../object_entry/types/ObjectEntryInformation.tsx";


interface VoltagesValuesProps {
    width?: string,
    height?: string,
}

function VoltagesValues({width, height}: Readonly<VoltagesValuesProps>) {
    const theme = useTheme();

    const batteryCurrent = useObjectEntryValue("input_board", "bat24_current")
    const batteryInfo = useObjectEntryInfo("input_board", "bat24_current")

    const superCapVoltage = useObjectEntryValue("input_board", "supercap_voltage")
    const superCapInfo = useObjectEntryInfo("input_board", "supercap_voltage")

    const link24current = useObjectEntryValue("input_board", "link24_current")
    const link24Info = useObjectEntryInfo("input_board", "link24_current")

    const link45current = useObjectEntryValue("input_board", "link45_current")
    const link45Info = useObjectEntryInfo("input_board", "link45_current")

    return (
        <Paper component="div" sx={{
            width,
            height,
        }}>
            <Typography textAlign="center" paddingTop="0.5em" paddingBottom="0.5em" variant="h6">
                Currents and Voltages
            </Typography>
            <Stack sx={{
                padding: 0
            }} direction="column" justifyContent="space-between">
                <Paper sx={{
                    backgroundColor: theme.palette.background.paper2,
                    marginLeft: "0.5em", marginRight: "0.5em",
                    marginBottom: "0.5em",
                    height: `2.8em`
                }}>
                    <Stack direction="row" justifyContent="space-between" paddingTop="0.8em" paddingLeft="0.5em" paddingRight="0.5em">
                        <Typography variant="body2" >
                            {`BatCur:  ${(batteryCurrent as number)?.toFixed(2)}A`}
                        </Typography>
                        <Typography variant="body2" width="15vh" textAlign="left">
                            {`Min:  ${getMin(batteryInfo)}A Max: ${getMax(batteryInfo)}A`}
                        </Typography>
                    </Stack>
                </Paper>
                <Paper sx={{
                    backgroundColor: theme.palette.background.paper2,
                    marginLeft: "0.5em", marginRight: "0.5em",
                    marginBottom: "0.5em",
                    height: `2.8em`
                }}>
                    <Stack direction="row" justifyContent="space-between" paddingTop="0.8em" paddingLeft="0.5em" paddingRight="0.5em">
                        <Typography variant="body2" >
                            {`SupCapV:  ${(superCapVoltage as number)?.toFixed(2)}V`}
                        </Typography>
                        <Typography variant="body2" width="15vh" textAlign="left">
                            {`Min:  ${getMin(superCapInfo)}V Max: ${getMax(superCapInfo)}V`}
                        </Typography>
                    </Stack>
                </Paper>
                <Paper sx={{
                    backgroundColor: theme.palette.background.paper2,
                    marginLeft: "0.5em", marginRight: "0.5em",
                    marginBottom: "0.5em",
                    height: `2.8em`
                }}>
                    <Stack direction="row" justifyContent="space-between" paddingTop="0.8em" paddingLeft="0.5em" paddingRight="0.5em">
                        <Typography variant="body2" >
                            {`Link24Cur:  ${(link24current as number)?.toFixed(2)}A`}
                        </Typography>
                        <Typography variant="body2" width="15vh" textAlign="left">
                            {`Min:  ${getMin(link24Info)}A Max: ${getMax(link24Info)}A`}
                        </Typography>
                    </Stack>
                </Paper>
                <Paper sx={{
                    backgroundColor: theme.palette.background.paper2,
                    marginLeft: "0.5em", marginRight: "0.5em",
                    marginBottom: "0.5em",
                    height: `2.8em`
                }}>
                    <Stack direction="row" justifyContent="space-between" paddingTop="0.8em" paddingLeft="0.5em" paddingRight="0.5em">
                        <Typography variant="body2" >
                            {`Link45Cur:  ${(link45current as number)?.toFixed(2)}A`}
                        </Typography>
                        <Typography variant="body2" width="15vh" textAlign="left">
                            {`Min:  ${getMin(link45Info)}A Max: ${getMax(link45Info)}A`}
                        </Typography>
                    </Stack>
                </Paper>
            </Stack>
        </Paper>
    );
}

export default VoltagesValues;
