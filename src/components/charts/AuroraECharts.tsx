// src/components/charts/AuroraECharts.tsx
import { useRef, useEffect, useMemo } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import ReactEChartsCore from "echarts-for-react/lib/core";
import type { HAEntity } from "@/types";

// Enregistrement modulaire pour bundle size optimal
echarts.use([
	LineChart,
	GridComponent,
	TooltipComponent,
	DataZoomComponent,
	CanvasRenderer,
]);

interface AuroraEChartProps {
	entity: HAEntity;
	timeRange?: string;
}

export function AuroraEChart({ entity, timeRange = "24h" }: AuroraEChartProps) {
	const chartRef = useRef<any>();

	// Configuration Aurora glassmorphism
	const option = useMemo(
		() => ({
			// Performance optimizations 2025
			animation: false,
			lazyUpdate: true,
			progressive: 1000,
			progressiveThreshold: 3000,
			useUtc: true,

			// Aurora styling
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
				textStyle: {
					color: "#fff",
				},
			},

			xAxis: {
				type: "time",
				boundaryGap: false,
				axisLine: {
					lineStyle: { color: "rgba(255, 255, 255, 0.3)" },
				},
				axisLabel: {
					color: "rgba(255, 255, 255, 0.7)",
					fontSize: 12,
				},
				splitLine: {
					show: true,
					lineStyle: {
						color: "rgba(255, 255, 255, 0.1)",
						type: "dashed",
					},
				},
			},

			yAxis: {
				type: "value",
				axisLine: {
					lineStyle: { color: "rgba(255, 255, 255, 0.3)" },
				},
				axisLabel: {
					color: "rgba(255, 255, 255, 0.7)",
					fontSize: 12,
				},
				splitLine: {
					lineStyle: {
						color: "rgba(255, 255, 255, 0.1)",
						type: "dashed",
					},
				},
			},

			series: [
				{
					name: entity.attributes.friendly_name,
					type: "line",
					data: entity.history,
					smooth: 0.3,
					lineStyle: {
						color: "#007AFF",
						width: 2,
					},
					areaStyle: {
						color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
							{ offset: 0, color: "rgba(0, 122, 255, 0.3)" },
							{ offset: 1, color: "rgba(0, 122, 255, 0.1)" },
						]),
					},
					symbol: "none",
					sampling: "lttb", // Large-Triangle-Three-Buckets sampling
				},
			],
		}),
		[entity],
	);

	// Cleanup mémoire critique 2025
	useEffect(() => {
		return () => {
			const chartInstance = chartRef.current?.getEchartsInstance();
			if (chartInstance) {
				chartInstance.dispose();
			}
		};
	}, []);

	return (
		<div className="h-64 w-full">
			<ReactEChartsCore
				ref={chartRef}
				echarts={echarts}
				option={option}
				style={{ height: "100%", width: "100%" }}
				opts={{ renderer: "canvas" }} // Canvas pour performance
			/>
		</div>
	);
}
