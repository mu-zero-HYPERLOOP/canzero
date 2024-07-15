import {Box} from "@mui/material";
import "./PowerVis.css"
import {useEffect} from "react";
import {Value} from "../../object_entry/types/Value.tsx";

interface PowerVisProps {
    value: Value | undefined,
    min: number,
    max: number,
    firstThreshold: number,
    secondThreshold: number,
}

function PowerVis({value, min, max, firstThreshold, secondThreshold}: Readonly<PowerVisProps>) {

    useEffect(() => {
        const arrow = document.getElementById("power-vis")!;
        if (value !== undefined) {
            value = value as number
            let innerThreshold = 24.5
            let outerThreshold = 48.5
            let width: number = 0

            if (value <= firstThreshold) {
                width = ((-outerThreshold) * (firstThreshold - value) + (-innerThreshold) * (value - min)) / (firstThreshold - min)
            } else if (value <= secondThreshold) {
                width = ((-innerThreshold) * (secondThreshold - value) + innerThreshold * (value - firstThreshold)) / (secondThreshold - firstThreshold)
            } else {
                width = (innerThreshold * (max - value) + outerThreshold * (value - secondThreshold)) / (max - secondThreshold)
            }

            arrow.style.setProperty("--x", `${width}cqw`);
        } else {
            arrow.style.setProperty("--x", `${0}cqw`);
        }

    }, []);

    return (
        <Box id="power-vis" alignItems="center">
            <div className="red1">
            </div>
            <div className="green">
            </div>
            <div className="red2">
            </div>
            <div className="arrow-up">
            </div>
            <div className="arrow-down">
            </div>
        </Box>
    )
}

export default PowerVis;
