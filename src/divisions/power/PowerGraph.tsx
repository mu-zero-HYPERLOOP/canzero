import { useEffect, useRef, useState } from "react";
import { ObjectEntryEvent } from "../../object_entry/types/events/ObjectEntryEvent";

import { listen } from "@tauri-apps/api/event";
import { ObjectEntryListenHistoryResponse } from "../../object_entry/types/events/ObjectEntryListenHistoryResponse";
import { invoke } from "@tauri-apps/api";
import { ObjectEntryHistoryEvent } from "../../object_entry/types/events/ObjectEntryHistoryEvent";

import * as d3 from "d3";
import { Slider, Stack } from "@mui/material";

function PowerGraph() {
    const svgRef = useRef(null) as any;

    const [autoWidth, setAutoWidth] = useState(0);

    const [maxY, setMaxY] = useState(1600);
    const [minY, setMinY] = useState(-125);
    const [timeDomain, setTimeDomain] = useState(10 * 1000);


    const marginLeft = 50;
    const marginRight = 0;
    const marginTop = 10;
    const marginBottom = 50;

    const colorPowBoard12TotalPow = "#E8020B";
    const colorPowBoard24TotalPow = "#1AC938";
    const colorInputBoardSysPowCons = "#023EFF";
    const colorLevitationBoard = "#00D7FF";
    const colorGuidanceBoard = "#FFC403";
    const colorMotorDriver = "#9F4800";
    const colorSdcSignal = "#F14CC2";
    const colorSdcBoard = "#8B2BE2";
    const colorCommunicationPowCons = "#FF7C01";

    const refreshRate = 100;
    const interval = 100;

    const height = 380;

    useEffect(() => {

        // AUTO RESIZING!
        let trueWidth = autoWidth;
        const innerWidth = trueWidth - marginLeft - marginRight;
        const innerHeight = height - marginTop - marginBottom;

        let resizeObserver: ResizeObserver | undefined = undefined;
        let current = svgRef.current;
        resizeObserver = new ResizeObserver(
            entries => {
                if (!Array.isArray(entries)) return;
                if (!entries.length) return;
                const entry = entries[0];
                if (trueWidth != entry.contentRect.width) {
                    setAutoWidth(entry.contentRect.width);
                }
            }
        );
        resizeObserver.observe(current);

        // REGISTER LISTENERS

        let pow_board_12_total_pow_data: ObjectEntryEvent[] = [];
        let pow_board_24__total_pow_data: ObjectEntryEvent[] = [];
        let input_board_sys_pow_cons_data: ObjectEntryEvent[] = [];
        let levitation_board_data: ObjectEntryEvent[] = [];
        let guidance_board_data: ObjectEntryEvent[] = [];
        let motor_driver_data: ObjectEntryEvent[] = [];
        let sdc_signal_data: ObjectEntryEvent[] = [];
        let sdc_board_data: ObjectEntryEvent[] = [];
        let communication_pow_cons_data: ObjectEntryEvent[] = [];

        let timestamp = 0; // initalized from listen history respnse!

        async function asyncRegister() {
            const respPowBoard12TotalPowerTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board12",
                objectEntryName: "total_power",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            pow_board_12_total_pow_data = respPowBoard12TotalPowerTerm.history;
            const unlistenPowBoard12TotalPowTerm = await listen<ObjectEntryHistoryEvent>(respPowBoard12TotalPowerTerm.event_name, event => {
                pow_board_12_total_pow_data.splice(0, event.payload.deprecated_count);
                pow_board_12_total_pow_data.push(...event.payload.new_values);
            });

            const respPowBoard24TotalPowTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board24",
                objectEntryName: "total_power",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            pow_board_24__total_pow_data = respPowBoard24TotalPowTerm.history;
            const unlistenPowBoard24TotalPowTerm = await listen<ObjectEntryHistoryEvent>(respPowBoard24TotalPowTerm.event_name, event => {
                pow_board_24__total_pow_data.splice(0, event.payload.deprecated_count);
                pow_board_24__total_pow_data.push(...event.payload.new_values);
            });

            const respInputBoardSysPowConsTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "input_board",
                objectEntryName: "system_power_consumption",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            input_board_sys_pow_cons_data = respInputBoardSysPowConsTerm.history;
            const unlistenInputBoardSysPowConsTerm = await listen<ObjectEntryHistoryEvent>(respInputBoardSysPowConsTerm.event_name, event => {
                input_board_sys_pow_cons_data.splice(0, event.payload.deprecated_count);
                input_board_sys_pow_cons_data.push(...event.payload.new_values);
            });

            const respLevitationBoardTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board12",
                objectEntryName: "levitation_boards_power_channel_current",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            levitation_board_data = respLevitationBoardTerm.history.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}});
            const unlistenLevitationBoardTerm = await listen<ObjectEntryHistoryEvent>(respLevitationBoardTerm.event_name, event => {
                levitation_board_data.splice(0, event.payload.deprecated_count);
                levitation_board_data.push(...event.payload.new_values.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}}));
            });

            const respGuidanceBoardTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board12",
                objectEntryName: "guidance_boards_power_channel_current",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            guidance_board_data = respGuidanceBoardTerm.history.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}});
            const unlistenGuidanceBoardTerm = await listen<ObjectEntryHistoryEvent>(respGuidanceBoardTerm.event_name, event => {
                guidance_board_data.splice(0, event.payload.deprecated_count);
                guidance_board_data.push(...event.payload.new_values.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}}));
            });

            const respMotorDriverTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board12",
                objectEntryName: "motor_driver_power_channel_current",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            motor_driver_data = respMotorDriverTerm.history.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}});
            const unlistenMotorDriverTerm = await listen<ObjectEntryHistoryEvent>(respMotorDriverTerm.event_name, event => {
                motor_driver_data.splice(0, event.payload.deprecated_count);
                motor_driver_data.push(...event.payload.new_values.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}}));
            });

            const respSdcSignalTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board24",
                objectEntryName: "sdc_signal_channel_current",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            sdc_signal_data = respSdcSignalTerm.history.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 24), timestamp: event.timestamp, delta_time: event.delta_time}});
            const unlistenSdcSignalTerm = await listen<ObjectEntryHistoryEvent>(respSdcSignalTerm.event_name, event => {
                sdc_signal_data.splice(0, event.payload.deprecated_count);
                sdc_signal_data.push(...event.payload.new_values.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 24), timestamp: event.timestamp, delta_time: event.delta_time}}));
            });

            const respSdcBoardTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "power_board24",
                objectEntryName: "sdc_board_power_channel_current",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            sdc_board_data = respSdcBoardTerm.history.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 24), timestamp: event.timestamp, delta_time: event.delta_time}});
            const unlistenSdcBoardTerm = await listen<ObjectEntryHistoryEvent>(respSdcBoardTerm.event_name, event => {
                sdc_board_data.splice(0, event.payload.deprecated_count);
                sdc_board_data.push(...event.payload.new_values.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 24), timestamp: event.timestamp, delta_time: event.delta_time}}));
            });

            const respCommunicationPowConsTerm = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
                nodeName: "input_board",
                objectEntryName: "communication_power_consumption",
                frameSize: timeDomain,
                minInterval: interval // 24fps
            });
            communication_pow_cons_data = respCommunicationPowConsTerm.history;
            const unlistenCommunicationPowConsTerm = await listen<ObjectEntryHistoryEvent>(respCommunicationPowConsTerm.event_name, event => {
                communication_pow_cons_data.splice(0, event.payload.deprecated_count);
                communication_pow_cons_data.push(...event.payload.new_values);
            });

            return () => {
                unlistenPowBoard12TotalPowTerm();
                unlistenPowBoard24TotalPowTerm();
                unlistenInputBoardSysPowConsTerm();
                unlistenLevitationBoardTerm();
                unlistenGuidanceBoardTerm();
                unlistenMotorDriverTerm();
                unlistenSdcSignalTerm();
                unlistenSdcBoardTerm();
                unlistenCommunicationPowConsTerm();
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board12",
                    objectEntryName: "total_power",
                    eventName: respPowBoard12TotalPowerTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board24",
                    objectEntryName: "total_power",
                    eventName: respPowBoard24TotalPowTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "input_board",
                    objectEntryName: "system_power_consumption",
                    eventName: respInputBoardSysPowConsTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board12",
                    objectEntryName: "levitation_boards_power_channel_current",
                    eventName: respLevitationBoardTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board12",
                    objectEntryName: "guidance_boards_power_channel_current",
                    eventName: respGuidanceBoardTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board12",
                    objectEntryName: "motor_driver_power_channel_current",
                    eventName: respMotorDriverTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board24",
                    objectEntryName: "sdc_signal_channel_current",
                    eventName: respSdcSignalTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "power_board24",
                    objectEntryName: "sdc_board_power_channel_current",
                    eventName: respSdcBoardTerm.event_name,
                }).catch(console.error);
                invoke("unlisten_from_history_of_object_entry", {
                    nodeName: "input_board",
                    objectEntryName: "communication_power_consumption",
                    eventName: respCommunicationPowConsTerm.event_name,
                }).catch(console.error);
            };
        }

        const asyncCleanup = asyncRegister();

        const xScale = d3.scaleLinear().range([0, innerWidth]);
        const yScale = d3.scaleLinear().range([innerHeight, 0]);

        const powBoard12TotalPowLine = d3.line();
        powBoard12TotalPowLine.curve(d3.curveStepAfter);
        powBoard12TotalPowLine.x((d: any) => xScale(d.timestamp));
        powBoard12TotalPowLine.y((d: any) => yScale(d.value));

        const powBoard24TotalPowLine = d3.line();
        powBoard24TotalPowLine.curve(d3.curveStepAfter);
        powBoard24TotalPowLine.x((d: any) => xScale(d.timestamp));
        powBoard24TotalPowLine.y((d: any) => yScale(d.value));

        const inputBoardSysPowConsLine = d3.line();
        inputBoardSysPowConsLine.curve(d3.curveStepAfter);
        inputBoardSysPowConsLine.x((d: any) => xScale(d.timestamp));
        inputBoardSysPowConsLine.y((d: any) => yScale(d.value));

        const levitationBoardLine = d3.line();
        levitationBoardLine.curve(d3.curveStepAfter);
        levitationBoardLine.x((d: any) => xScale(d.timestamp));
        levitationBoardLine.y((d: any) => yScale(d.value));

        const guidanceBoardLine = d3.line();
        guidanceBoardLine.curve(d3.curveStepAfter);
        guidanceBoardLine.x((d: any) => xScale(d.timestamp));
        guidanceBoardLine.y((d: any) => yScale(d.value));

        const motorDriverLine = d3.line();
        motorDriverLine.curve(d3.curveStepAfter);
        motorDriverLine.x((d: any) => xScale(d.timestamp));
        motorDriverLine.y((d: any) => yScale(d.value));

        const sdcSignalLine = d3.line();
        sdcSignalLine.curve(d3.curveStepAfter);
        sdcSignalLine.x((d: any) => xScale(d.timestamp));
        sdcSignalLine.y((d: any) => yScale(d.value));

        const sdcBoardLine = d3.line();
        sdcBoardLine.curve(d3.curveStepAfter);
        sdcBoardLine.x((d: any) => xScale(d.timestamp));
        sdcBoardLine.y((d: any) => yScale(d.value));

        const communicationPowConsLine = d3.line();
        communicationPowConsLine.curve(d3.curveStepAfter);
        communicationPowConsLine.x((d: any) => xScale(d.timestamp));
        communicationPowConsLine.y((d: any) => yScale(d.value));


        const timeAxis = d3.axisBottom(xScale)
            .tickFormat(x => `${x as number / 1000.0}s`)
            .ticks(5);

        const yAxis = d3.axisLeft(yScale).tickFormat(x => `${x}`);

        const yAxisGrid = d3.axisLeft(yScale)
            .tickSize(-innerWidth)
            .tickFormat("" as any)
            .ticks(5);

        const xAxisGrid = d3.axisTop(xScale)
            .tickSize(-innerWidth)
            .tickFormat("" as any)
            .ticks(5);

        const svg = d3.select(svgRef.current)
            .attr("width", "100%")
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${marginLeft},${marginTop})`)

        svg.append("defs").append("clipPath").attr("id", "clip").append("rect")
            .attr("width", Math.max(innerWidth, 0))
            .attr("height", innerHeight);

        const graph = svg.append("g");
        graph.attr("clip-path", "url(#clip)");


        const a = svg.append("g")
            .attr("transform", `translate(0 ${innerHeight})`)
            .call(timeAxis);

        const b = svg.append("g")
            .attr("transform", "translate(0 0)")
            .call(yAxis);

        const c = graph.append("g")
            .style("color", "#afcdfa")
            .style("stroke-width", 0.5)
            .call(yAxisGrid);

        const d = graph.append("g")
            .style("color", "#afcdfa")
            .style("stroke-width", 0.5)
            .call(xAxisGrid);

        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 25)
            .attr("text-anchor", "end")
            .attr("fill", colorPowBoard12TotalPow)
            .text("PowerBoard12");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 50)
            .attr("text-anchor", "end")
            .attr("fill", colorPowBoard24TotalPow)
            .text("PowerBoard24");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 75)
            .attr("text-anchor", "end")
            .attr("fill", colorInputBoardSysPowCons)
            .text("SystemPower");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 100)
            .attr("text-anchor", "end")
            .attr("fill", colorLevitationBoard)
            .text("LevitationBoard");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 125)
            .attr("text-anchor", "end")
            .attr("fill", colorGuidanceBoard)
            .text("GuidanceBoard");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 150)
            .attr("text-anchor", "end")
            .attr("fill", colorMotorDriver)
            .text("MotorDriver");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 175)
            .attr("text-anchor", "end")
            .attr("fill", colorSdcSignal)
            .text("SDC Signal");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 200)
            .attr("text-anchor", "end")
            .attr("fill", colorSdcBoard)
            .text("SDC Board");
        svg.append("text")
            .attr("x", innerWidth)
            .attr("y", 225)
            .attr("text-anchor", "end")
            .attr("fill", colorCommunicationPowCons)
            .text("Communication");

        const group = graph.append("g");

        group.append("path")
            .datum(pow_board_12_total_pow_data)
            .attr("d", powBoard12TotalPowLine(pow_board_12_total_pow_data as any))
            .attr("class", "powBoard12TotalPow-line")
            .style("stroke", colorPowBoard12TotalPow)
            .style("stroke-width", 1.5)
            .style("opacity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(pow_board_24__total_pow_data)
            .attr("d", powBoard24TotalPowLine(pow_board_24__total_pow_data as any))
            .attr("class", "powBoard24TotalPow-line")
            .style("stroke", colorPowBoard24TotalPow)
            .style("stroke-width", 1.5)
            .style("opacity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(input_board_sys_pow_cons_data)
            .attr("d", inputBoardSysPowConsLine(input_board_sys_pow_cons_data as any))
            .attr("class", "inputBoardSysPowCons-line")
            .style("stroke", colorInputBoardSysPowCons)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(levitation_board_data)
            .attr("d", levitationBoardLine(levitation_board_data as any))
            .attr("class", "levitationBoard-line")
            .style("stroke", colorLevitationBoard)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(guidance_board_data)
            .attr("d", guidanceBoardLine(guidance_board_data as any))
            .attr("class", "guidanceBoard-line")
            .style("stroke", colorGuidanceBoard)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(motor_driver_data)
            .attr("d", motorDriverLine(motor_driver_data as any))
            .attr("class", "motorDriver-line")
            .style("stroke", colorMotorDriver)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(sdc_signal_data)
            .attr("d", sdcSignalLine(sdc_signal_data as any))
            .attr("class", "sdcSignal-line")
            .style("stroke", colorSdcSignal)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(sdc_board_data)
            .attr("d", sdcBoardLine(sdc_board_data as any))
            .attr("class", "sdcBoard-line")
            .style("stroke", colorSdcBoard)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        group.append("path")
            .datum(communication_pow_cons_data)
            .attr("d", communicationPowConsLine(communication_pow_cons_data as any))
            .attr("class", "communicationPowCons-line")
            .style("stroke", colorCommunicationPowCons)
            .style("stroke-width", 1.5)
            .style("opatimeDomainMscity", 0.5)
            .style("fill", "none")

        let running = true;
        const timeShiftMs = 0;


        function updateXScale() {
            xScale.domain([timestamp - timeDomain, timestamp - timeShiftMs])
        }

        function updateYScale() {
            yScale.domain([minY, maxY]);
        }

        function updateSvgLineGraph() {
            group.attr("transform", "");
            group.select(".powBoard12TotalPow-line")
                .datum(pow_board_12_total_pow_data as any)
                .attr("d", powBoard12TotalPowLine);

            group.select(".powBoard24TotalPow-line")
                .datum(pow_board_24__total_pow_data as any)
                .attr("d", powBoard24TotalPowLine);

            group.select(".inputBoardSysPowCons-line")
                .datum(input_board_sys_pow_cons_data as any)
                .attr("d", inputBoardSysPowConsLine);

            group.select(".levitationBoard-line")
                .datum(levitation_board_data as any)
                .attr("d", levitationBoardLine);

            group.select(".guidanceBoard-line")
                .datum(guidance_board_data as any)
                .attr("d", guidanceBoardLine);

            group.select(".motorDriver-line")
                .datum(motor_driver_data as any)
                .attr("d", motorDriverLine);

            group.select(".sdcSignal-line")
                .datum(sdc_signal_data as any)
                .attr("d", sdcSignalLine);

            group.select(".sdcBoard-line")
                .datum(sdc_board_data as any)
                .attr("d", sdcBoardLine);

            group.select(".communicationPowCons-line")
                .datum(communication_pow_cons_data as any)
                .attr("d", communicationPowConsLine);

        }

        function updateSvg() {
            timestamp += refreshRate;
            updateXScale();
            updateYScale();
            updateSvgLineGraph();
            a.transition()
                .duration(refreshRate)
                .ease(d3.easeLinear)
                .call(timeAxis);
            b.call(yAxis);
            c.call(yAxisGrid);
            d.call(xAxisGrid);

            if (running) {
                //restart animation
                d3.active(group.node())
                    ?.transition()
                    .on("start", updateSvg)
                    .attr("transform", `translate(${xScale(timestamp - timeDomain - refreshRate)},0)`);
            }
        }

        group.transition()
            .on("start", updateSvg)
            .ease(d3.easeLinear)
            .duration(refreshRate);

        return () => {

            asyncCleanup.then(f => f()).catch(console.error);

            resizeObserver?.unobserve(current);

            running = false;
            svg.remove();
        };

    }, [autoWidth, minY, maxY, timeDomain]);

    const [yRange, setYRange] = useState([minY, maxY]);

    const handleChange = (_event: Event, newValue: number | number[]) => {
        setYRange(newValue as number[]);
        setMinY((newValue as number[])[0]);
        setMaxY((newValue as number[])[1]);
    };

    const [xRange, setXRange] = useState(10);

    const handleXChange = (_event: Event, newValue: number | number[]) => {
        setXRange(newValue as number);
        setTimeDomain((newValue as number) * 1000);
    };

    return (
        <Stack direction="row" spacing={2} sx={{
            height: "100%",
        }}>
            <Stack direction="column" spacing={2} sx={{
                width: "100%"
            }}>
                <Stack direction="row" justifyContent="end" spacing={3}>

                    <Slider
                        getAriaValueText={() => 'Minimum distance'}
                        valueLabelDisplay="auto"
                        min={1}
                        max={60}
                        value={xRange}
                        onChange={handleXChange}
                        sx={{width: "98%"}}
                    />

                </Stack>
                <svg ref={svgRef}></svg>
            </Stack>

            <Slider
                getAriaLabel={() => 'Minimum distance'}
                valueLabelDisplay="auto"
                orientation="vertical"
                min={0}
                max={10000}
                onChange={handleChange}
                value={yRange}
                sx={{top: "3em",
                    height: "20em"}}
            />
        </Stack>
    );
}

export default PowerGraph;
