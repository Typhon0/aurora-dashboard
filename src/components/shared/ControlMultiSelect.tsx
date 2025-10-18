import type React from "react";
import { useState, useMemo, useId, useCallback } from "react";
import {
	Command,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
} from "@/components/ui/command";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X } from "lucide-react";

export interface MultiSelectOption<T extends string = string> {
	value: T;
	label: string;
	keywords?: string[];
	disabled?: boolean;
}

export interface ControlMultiSelectProps<T extends string = string> {
	values?: T[];
	defaultValues?: T[];
	onValuesChange?: (vals: T[]) => void;
	options: MultiSelectOption<T>[];
	label?: React.ReactNode;
	description?: React.ReactNode;
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	clearable?: boolean;
	disabled?: boolean;
	maxVisibleChips?: number;
	className?: string;
	buttonClassName?: string;
	layout?: "row" | "column";
	size?: "sm" | "md" | "lg";
	maxHeightPx?: number;
	filter?: (query: string, option: MultiSelectOption<T>) => boolean;
}

export function ControlMultiSelect<T extends string = string>({
	values,
	defaultValues = [],
	onValuesChange,
	options,
	label,
	description,
	placeholder = "Select...",
	searchPlaceholder = "Search...",
	emptyText = "No results",
	clearable = true,
	disabled,
	maxVisibleChips = 3,
	className,
	buttonClassName,
	layout = "row",
	size = "md",
	maxHeightPx = 260,
	filter,
}: ControlMultiSelectProps<T>) {
	const [open, setOpen] = useState(false);
	const isControlled = Array.isArray(values);
	const [internal, setInternal] = useState<T[]>(defaultValues);
	const current = isControlled ? (values as T[]) : internal;
	const [query, setQuery] = useState("");
	const id = useId();

	const sizeCls =
		size === "sm" ? "h-8 text-xs" : size === "lg" ? "h-10 text-base" : "h-9";

	const effectiveFilter = useCallback(
		(q: string, o: MultiSelectOption<T>) => {
			if (filter) return filter(q, o);
			if (!q) return true;
			const hay = (o.label + " " + (o.keywords?.join(" ") || "")).toLowerCase();
			return hay.includes(q.toLowerCase());
		},
		[filter],
	);

	const filtered = useMemo(
		() => options.filter((o) => effectiveFilter(query, o)),
		[options, query, effectiveFilter],
	);

	const setVals = (next: T[]) => {
		if (!isControlled) setInternal(next);
		onValuesChange?.(next);
	};

	const toggleVal = (val: T) => {
		setVals(
			current.includes(val)
				? current.filter((v) => v !== val)
				: [...current, val],
		);
	};

	const clearAll = (e: React.MouseEvent) => {
		e.stopPropagation();
		setVals([]);
	};

	const chipData = current
		.map((v) => options.find((o) => o.value === v)?.label || v)
		.filter(Boolean) as string[];
	const hiddenCount = Math.max(0, chipData.length - maxVisibleChips);

	return (
		<div
			className={cn(
				"flex w-full",
				layout === "row"
					? "items-center justify-between gap-4"
					: "flex-col gap-2",
				className,
			)}
		>
			{(label || description) && (
				<div className={cn("min-w-0", layout === "row" ? "flex-1" : "w-full")}>
					{label && (
						<div
							id={`${id}-label`}
							className="mb-1 text-sm font-medium leading-none text-foreground/90"
						>
							{label}
						</div>
					)}
					{description && (
						<div
							id={`${id}-desc`}
							className="text-xs leading-snug text-muted-foreground/80"
						>
							{description}
						</div>
					)}
				</div>
			)}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						type="button"
						variant="outline"
						disabled={disabled}
						aria-labelledby={label ? `${id}-label` : undefined}
						aria-describedby={description ? `${id}-desc` : undefined}
						className={cn(
							"justify-between gap-2",
							sizeCls,
							"w-64", // multi-select a bit wider
							chipData.length === 0 && "text-muted-foreground",
							buttonClassName,
						)}
					>
						<span className="flex min-w-0 flex-1 flex-wrap gap-1">
							{chipData.length === 0 && (
								<span className="line-clamp-1">{placeholder}</span>
							)}
							{chipData.slice(0, maxVisibleChips).map((c) => (
								<span
									key={c}
									className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-foreground/90"
								>
									{c}
								</span>
							))}
							{hiddenCount > 0 && (
								<span className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/70">
									+{hiddenCount}
								</span>
							)}
						</span>
						{clearable && current.length > 0 && !disabled && (
							<X
								className="h-4 w-4 opacity-60 hover:opacity-100"
								onClick={clearAll}
							/>
						)}
						<ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="p-0"
					align="start"
					style={{ width: "var(--radix-popover-trigger-width)" }}
				>
					<Command
						shouldFilter={false}
						onKeyDown={(e) => {
							if (e.key === "Escape") setOpen(false);
						}}
					>
						<CommandInput
							placeholder={searchPlaceholder}
							value={query}
							onValueChange={setQuery}
							autoFocus
						/>
						<CommandList style={{ maxHeight: maxHeightPx }}>
							<CommandEmpty>{emptyText}</CommandEmpty>
							<CommandGroup>
								{filtered.map((o) => {
									const selected = current.includes(o.value);
									return (
										<CommandItem
											key={o.value}
											value={o.label}
											disabled={o.disabled}
											onSelect={() => toggleVal(o.value)}
											className={cn(
												"flex items-center",
												selected && "aria-selected:bg-accent",
											)}
										>
											<Check
												className={cn(
													"mr-2 h-4 w-4",
													selected ? "opacity-100" : "opacity-0",
												)}
											/>
											<span className="line-clamp-1">{o.label}</span>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}

ControlMultiSelect.displayName = "ControlMultiSelect";

export default ControlMultiSelect;
