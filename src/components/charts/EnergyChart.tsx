import { useMemo, useRef, useEffect } from "react";
import { AuroraCard } from "@/components/cards/AuroraCard";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import ReactEChartsCore from "echarts-for-react/lib/core";

// Register only what we use (tree‑shake friendly)
echarts.use([
	LineChart,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	CanvasRenderer,
]);

export interface EnergyData {
	time: string;
	consumption: number;
}

export interface EnergyChartProps {
	data: EnergyData[];
	title?: string;
	color?: string;
	gradientFrom?: string;
	gradientTo?: string;
	smooth?: boolean;
	height?: number;
	showTooltip?: boolean;
	unit?: string;
	progressive?: number; // number of points for progressive rendering
	sampling?: "lttb" | "average" | "max" | "min" | "sum" | "none";
}

export function EnergyChart({
	data,
	title = "Consommation Énergétique",
	color = "#007AFF",
	gradientFrom = "rgba(0, 122, 255, 0.30)",
	gradientTo = "rgba(0, 122, 255, 0.05)",
	smooth = true,
	height = 192,
	showTooltip = true,
	unit = "kWh",
	progressive = 800,
	sampling = "lttb",
}: EnergyChartProps) {
	// Ref to the ECharts React wrapper instance
	const chartRef = useRef<InstanceType<typeof ReactEChartsCore> | null>(null);
	const hasData = data && data.length > 0;

	const option = useMemo(() => {
		if (!hasData) return {};
		return {
			animation: false,
			backgroundColor: "transparent",
			useUtc: true,
			grid: {
				left: "3%",
				right: "4%",
				bottom: "8%",
				top: "10%",
				containLabel: true,
			},
			tooltip: showTooltip
				? {
						trigger: "axis",
						backgroundColor: "rgba(0,0,0,0.80)",
						borderColor: color,
						borderWidth: 1,
						textStyle: { color: "#fff" },
						valueFormatter: (val: number | string) => `${val} ${unit}`,
					}
				: undefined,
			xAxis: {
				type: "category",
				data: data.map((d) => d.time),
				boundaryGap: false,
				axisLine: { lineStyle: { color: "rgba(255,255,255,0.30)" } },
				axisLabel: { color: "rgba(255,255,255,0.65)" },
				splitLine: { show: false },
			},
			yAxis: {
				type: "value",
				axisLine: { lineStyle: { color: "rgba(255,255,255,0.30)" } },
				axisLabel: { color: "rgba(255,255,255,0.65)" },
				splitLine: {
					lineStyle: { color: "rgba(255,255,255,0.10)", type: "dashed" },
				},
			},
			dataZoom: [
				{ type: "inside", throttle: 50 },
				// future: external mini-map zoom slider
			],
			series: [
				{
					name: title,
					type: "line",
					data: data.map((d) => d.consumption),
					smooth,
					symbol: "none",
					lineStyle: { color, width: 2 },
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: gradientFrom },
							{ offset: 1, color: gradientTo },
						]),
					},
					sampling,
					progressive,
				},
			],
		} as const;
	}, [
		hasData,
		data,
		color,
		gradientFrom,
		gradientTo,
		smooth,
		title,
		showTooltip,
		unit,
		sampling,
		progressive,
	]);

	// Cleanup to prevent memory leaks on hot reload/unmount
	useEffect(() => {
		return () => {
			const inst = chartRef.current?.getEchartsInstance();
			// Dispose safely if API present and not already disposed
			if (
				inst &&
				typeof (inst as unknown as { isDisposed?: () => boolean })
					.isDisposed === "function"
			) {
				if (!(inst as unknown as { isDisposed: () => boolean }).isDisposed()) {
					inst.dispose();
				}
			} else if (inst) {
				// Fallback: attempt dispose
				try {
					inst.dispose();
				} catch {
					/* noop */
				}
			}
		};
	}, []);

	return (
		<AuroraCard size="large" title={title} icon="⚡">
			<div className="w-full" style={{ height }}>
				{hasData ? (
					<ReactEChartsCore
						ref={chartRef}
						echarts={echarts}
						option={option}
						style={{ height: "100%", width: "100%" }}
						opts={{ renderer: "canvas" }}
						notMerge
						lazyUpdate
					/>
				) : (
					<div className="flex h-full items-center justify-center text-xs text-white/50">
						No energy data
					</div>
				)}
			</div>
		</AuroraCard>
	);
}
