import React from "react";
import ReactECharts from "echarts-for-react";
import { AuroraCard } from "@/components/cards/AuroraCard";
import * as echarts from "echarts";

interface EnergyData {
	time: string;
	consumption: number;
}

interface EnergyChartProps {
	data: EnergyData[];
}

export function EnergyChart({ data }: EnergyChartProps) {
	const option = {
		animation: false,
		backgroundColor: "transparent",

		grid: {
			left: "3%",
			right: "4%",
			bottom: "8%",
			top: "10%",
			containLabel: true,
		},

		tooltip: {
			trigger: "axis",
			backgroundColor: "rgba(0, 0, 0, 0.8)",
			borderColor: "rgba(0, 122, 255, 0.4)",
			borderWidth: 1,
			textStyle: { color: "#fff" },
		},

		xAxis: {
			type: "category",
			data: data.map((d) => d.time),
			axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.3)" } },
			axisLabel: { color: "rgba(255, 255, 255, 0.7)" },
		},

		yAxis: {
			type: "value",
			axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.3)" } },
			axisLabel: { color: "rgba(255, 255, 255, 0.7)" },
			splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.1)" } },
		},

		series: [
			{
				name: "Consommation",
				type: "line",
				data: data.map((d) => d.consumption),
				smooth: true,
				lineStyle: { color: "#007AFF", width: 2 },
				areaStyle: {
					color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
						{ offset: 0, color: "rgba(0, 122, 255, 0.3)" },
						{ offset: 1, color: "rgba(0, 122, 255, 0.1)" },
					]),
				},
				symbol: "none",
			},
		],
	};

	return (
		<AuroraCard size="large" title="Consommation Énergétique" icon="⚡">
			<div className="h-48 w-full">
				<ReactECharts
					option={option}
					style={{ height: "100%", width: "100%" }}
					opts={{ renderer: "canvas" }}
				/>
			</div>
		</AuroraCard>
	);
}
