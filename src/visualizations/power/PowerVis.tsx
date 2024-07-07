import {Box} from "@mui/material";
import "./PowerVis.css"
import {useEffect} from "react";
import {Value} from "../../object_entry/types/Value.tsx";

interface PowerVisProps {
    value: Value | undefined,
}

function PowerVis({value}: Readonly<PowerVisProps>) {

    useEffect(() => {
        const arrow = document.getElementById("power-vis")!;

        if (value === undefined) {
            arrow.style.setProperty("--x", `${-40}cqh`);
        } else {
            arrow.style.setProperty("--x", `${0}vh`);
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