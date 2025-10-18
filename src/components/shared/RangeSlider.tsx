import { useState, useEffect, useRef, type ChangeEvent } from "react";

export interface RangeSliderProps
	extends Omit<React.ComponentPropsWithoutRef<"input">, "onChange"> {
	min?: number;
	max?: number;
	step?: number;
	value?: number;
	onChange?: (value: number, event: ChangeEvent<HTMLInputElement>) => void;
	onChangeComplete?: (
		value: number,
		event: ChangeEvent<HTMLInputElement>,
	) => void;
	label?: string;
	description?: string;
	hideTooltip?: boolean;
	formatTooltipValue?: (value: number) => string;
	tooltipSizeRem?: number; // size of bubble diameter in rem
	handleSizePx?: number;
}

export function RangeSlider({
	min = 0,
	max = 100,
	step = 1,
	value: controlled,
	onChange,
	onChangeComplete,
	label,
	description,
	hideTooltip = false,
	formatTooltipValue,
	tooltipSizeRem = 2,
	handleSizePx = 16,
	className,
	...rest
}: RangeSliderProps) {
	const [value, setValue] = useState<number>(controlled ?? min);
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);

	// sync external
	useEffect(() => {
		if (typeof controlled === "number" && controlled !== value)
			setValue(controlled);
	}, [controlled, value]);

	// update tooltip position/value
	useEffect(() => {
		if (!inputRef.current || !tooltipRef.current || hideTooltip) return;
		const percent = ((value - min) / (max - min)) * 100;
		tooltipRef.current.style.left = `${percent}%`;
		const raw = value;
		const formatted = formatTooltipValue ? formatTooltipValue(raw) : raw;
		tooltipRef.current.setAttribute("data-title", String(formatted));
	}, [value, min, max, hideTooltip, formatTooltipValue]);

	const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
		const v = e.target.valueAsNumber;
		setValue(v);
		onChange?.(v, e);
	};
	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		onChangeComplete?.(e.target.valueAsNumber, e);
	};

	return (
		<div className={`w-full select-none ${className ?? ""}`}>
			{label && (
				<label className="block mb-1 text-xs font-medium text-white/80">
					{label}
				</label>
			)}
			{description && (
				<div className="block mb-2 text-[11px] text-white/50">
					{description}
				</div>
			)}
			<div
				className={`relative group ${dragging ? "[&_.rs-tooltip>div]:opacity-100" : ""}`}
				onPointerDown={() => setDragging(true)}
				onPointerUp={() => setDragging(false)}
				onPointerLeave={() => setDragging(false)}
			>
				<input
					ref={inputRef}
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onInput={handleInput}
					onChange={handleChange}
					className="range-slider w-full h-2 rounded-md appearance-none bg-white/10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
					style={{
						WebkitAppearance: "none",
					}}
					{...rest}
				/>
				{/* track styling via pseudo elements using global CSS could be added later */}
				{!hideTooltip && (
					<div
						className="absolute top-0 left-0 right-0 h-0 pointer-events-none rs-tooltip"
						style={{
							paddingLeft: handleSizePx / 2,
							paddingRight: handleSizePx / 2,
						}}
					>
						<div
							ref={tooltipRef}
							className="absolute translate-y-[-0.5rem] -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200"
							style={{
								width: `${tooltipSizeRem}rem`,
								height: `${tooltipSizeRem}rem`,
							}}
						>
							<div className="w-full h-full rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center rotate-[-45deg]">
								<span className="rotate-[45deg]" data-slot="value-holder">
									{/* value text injected via data-title (for accessibility we mirror below) */}
									{formatTooltipValue ? formatTooltipValue(value) : value}
								</span>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
