// src/components/charts/Sparkline.tsx
// Ultra-light sparkline wrapper around ECharts for tiny inline trends.
// Designed for embedding inside cards (Sensor, Gauge, Energy, Battery Summary, etc.)
import { useMemo } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import ReactEChartsCore from "echarts-for-react/lib/core";

// Register minimal features only (keep bundle lean)
echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

export interface SparklinePoint {
	t: number | string; // timestamp or label
	v: number; // value
}

export interface SparklineProps {
	data: SparklinePoint[];
	height?: number;
	color?: string; // line color override
	gradientFrom?: string;
	gradientTo?: string;
	smooth?: boolean;
	showTooltip?: boolean;
	className?: string;
	ariaLabel?: string;
}

export function Sparkline({
	data,
	height = 42,
	color = "#25A6FF",
	gradientFrom = "rgba(37,166,255,0.35)",
	gradientTo = "rgba(37,166,255,0.05)",
	smooth = true,
	showTooltip = true,
	className,
	ariaLabel = "trend sparkline",
}: SparklineProps) {
	const option = useMemo(() => {
		const seriesData = data.map((p) => [p.t, p.v]);
		return {
			animation: false,
			backgroundColor: "transparent",
			grid: { left: 0, right: 0, top: 0, bottom: 0 },
			tooltip: showTooltip
				? {
						trigger: "axis",
						backgroundColor: "rgba(0,0,0,0.75)",
						borderColor: color,
						borderWidth: 1,
						padding: 6,
						textStyle: { color: "#fff", fontSize: 11 },
						axisPointer: { type: "line", lineStyle: { color, width: 1 } },
					}
				: undefined,
			xAxis: {
				type: "category",
				show: false,
				boundaryGap: false,
				data: seriesData.map((d) => d[0]),
			},
			yAxis: {
				type: "value",
				show: false,
				scale: true,
			},
			series: [
				{
					type: "line",
					data: seriesData.map((d) => d[1]),
					smooth,
					symbol: "none",
					lineStyle: { color, width: 1.6 },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: gradientFrom },
							{ offset: 1, color: gradientTo },
						]),
					},
					sampling: "lttb",
				},
			],
		} as const;
	}, [data, color, gradientFrom, gradientTo, smooth, showTooltip]);

	return (
		<div
			className={className}
			style={{ height }}
			role="img"
			aria-label={ariaLabel}
		>
			<ReactEChartsCore
				echarts={echarts}
				option={option}
				style={{ height: "100%", width: "100%" }}
				opts={{ renderer: "canvas" }}
				notMerge
				lazyUpdate
			/>
		</div>
	);
}
