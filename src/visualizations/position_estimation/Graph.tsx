import { useEffect, useRef, useState } from "react";
import { ObjectEntryEvent } from "../../object_entry/types/events/ObjectEntryEvent";

import { listen } from "@tauri-apps/api/event";
import { ObjectEntryListenHistoryResponse } from "../../object_entry/types/events/ObjectEntryListenHistoryResponse";
import { invoke } from "@tauri-apps/api";
import { ObjectEntryHistoryEvent } from "../../object_entry/types/events/ObjectEntryHistoryEvent";

import * as d3 from "d3";
import { Box, Stack, Typography } from "@mui/material";
import useObjectEntryValue from "../../hooks/object_entry_value";

const nodeName = "input_board";
const oes = ["position", "velocity", "acceleration"]

const minY = -30;
const maxY = 30;


const timeDomain = 10 * 1000;

const marginLeft = 50;
const marginRight = 0;
const marginTop = 20;
const marginBottom = 50;

const refreshRate = 100;
const interval = 100;

const height = 250;


const lineColors = [
  "#E8020B",
  "#1AC938",
  "#023EFF",
  "#00D7FF",
  "#FFC403",
  "#9F4800",
  "#F14CC2",
  "#8B2BE2",
  "#FF7C01",
];


function Graph() {
  const svgRef = useRef(null) as any;

  const [autoWidth, setAutoWidth] = useState(0);
  const positionConfidence = useObjectEntryValue("input_board", "absolute_position_known");


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

    let data: (ObjectEntryEvent[])[] = [];
    for (let _ in oes) {
      data.push([]);
    }

    let timestamp = 0; // initalized from listen history respnse!

    async function asyncRegister() {

      let unlisteners: (() => void)[] = [];

      for (let [i, oe] of oes.entries()) {
        const resp = await invoke<ObjectEntryListenHistoryResponse>("listen_to_history_of_object_entry", {
          nodeName,
          objectEntryName: oe,
          frameSize: timeDomain,
          minInterval: interval // 24fps
        });
        if (oe !== "acceleration") {
          data[i] = resp.history;
        } else {
          let factor = (i == 0) ? 1 : 10;
          data[i] = resp.history.map((event: ObjectEntryEvent) => {return {value: (event.value as number * factor), timestamp: event.timestamp, delta_time: event.delta_time}});
        }
        if (i == 0) {
          timestamp = resp.now;
        }
        const unlistenJs = await listen<ObjectEntryHistoryEvent>(resp.event_name, event => {
          data[i].splice(0, event.payload.deprecated_count);
          if (oe !== "acceleration") {
            data[i].push(...event.payload.new_values);
          } else {
            data[i].push(...event.payload.new_values.map((event: ObjectEntryEvent) => {return {value: (event.value as number * 12), timestamp: event.timestamp, delta_time: event.delta_time}}))
          }
        });
        unlisteners.push(() => {
          unlistenJs();
          invoke("unlisten_from_history_of_object_entry", {
            nodeName,
            objectEntryName: oe,
            eventName: resp.event_name,
          }).catch(console.error);
        });
      }

      return () => {
        unlisteners.map(f => f());
      };
    }

    const asyncCleanup = asyncRegister();

    const xScale = d3.scaleLinear().range([0, innerWidth]);
    const yScale = d3.scaleLinear().range([innerHeight, 0]);

    let lines: d3.Line<[number, number]>[] = [];
    for (let _ of oes) {
      const line = d3.line();
      line.curve(d3.curveStepAfter);
      line.x((d: any) => xScale(d.timestamp));
      line.y((d: any) => yScale(d.value));
      lines.push(line);
    }

    const timeAxis = d3.axisBottom(xScale)
      .tickFormat(x => `${x as number / 1000.0}s`)
      .ticks(5);

    const yAxis = d3.axisLeft(yScale).tickFormat(x => `${x}`);

    const yAxisGrid = d3.axisLeft(yScale)
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


    // for (let [i, oe] of oes.entries()) {
    //   svg.append("text")
    //     .attr("x", innerWidth - 150)
    //     .attr("y", i * 25)
    //     .attr("text-anchor", "start")
    //     .attr("fill", lineColors[i])
    //     .text(`${oe} : ${(1 as number)?.toFixed(2)}`);
    // }
    const group = graph.append("g");

    for (let [i, oe] of oes.entries()) {
      let lineColor = (i<lineColors.length) ? lineColors[i] : "#000000"
      group.append("path")
        .datum(data[i])
        .attr("d", lines[i](data[i] as any))
        .attr("class", oe)
        .style("stroke", lineColor)
        .style("stroke-width", 1.5)
        .style("opacity", 0.5)
        .style("fill", "none")
    }

    let running = true;
    const timeShiftMs = 0;


    function updateXScale() {
      xScale.domain([timestamp - timeDomain, timestamp - timeShiftMs])
    }

    function updateYScale() {
      yScale.domain([minY, maxY]);
    }

    function updateSvgLineGraph() {

      for (let [i, oe] of oes.entries()) {
        group.attr("transform", "");
        group.select(`.${oe}`)
          .datum(data[i] as any)
          .attr("d", lines[i]);
      }

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

  }, [autoWidth, nodeName, timeDomain]);

  const pos = useObjectEntryValue("input_board", "position");
  const vel = useObjectEntryValue("input_board", "velocity");
  let acc = useObjectEntryValue("input_board", "acceleration");
  if (acc !== undefined) acc = acc as number * 10;

  return (
    <Stack direction="row" spacing={2} sx={{
      width: "calc(50% + 9.8em)",
      position: "absolute"
    }} alignItems="start">
      <svg ref={svgRef}></svg>

      <Box paddingTop={1} paddingRight={1}>
      </Box>
      <Stack direction="column" sx={{
        position: "relative",
        right: "15em",
        top: "1em",
      }}>  
        <Typography noWrap textAlign="right" color={lineColors[0]} sx={{
          marginRight: "1.2rem"
        }}>
          {`${positionConfidence == "TRUE" ? "absolute-Position" : "relative-Position"}:  ${(pos === undefined) ? `?m` : `${(pos as number).toFixed(2)}m`}`}
        </Typography>
        <Typography noWrap textAlign="right" color={lineColors[1]} sx={{
          marginRight: "0.3rem",
        }}>
          {`Velocity*10: ${(vel === undefined) ? `?m/s` : `${(vel as number).toFixed(2)}m/s`}`}
        </Typography>
        <Typography noWrap textAlign="right" color={lineColors[2]}>
          {`Acceleration*10: ${(acc === undefined) ? `?m/s²` : `${(acc as number).toFixed(2)}m/s²`}`}
        </Typography>
      </Stack>
    </Stack>
  );
}

export default Graph;
