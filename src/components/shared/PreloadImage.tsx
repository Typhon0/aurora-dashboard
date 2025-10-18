import { useEffect, useRef, useCallback } from "react";

export interface PreloadImageProps
	extends Omit<React.ComponentPropsWithoutRef<"div">, "onLoad" | "onError"> {
	src: string;
	lazy?: boolean;
	duration?: number; // ms
	ease?: string;
	innerStyle?: {
		backgroundSize?: string;
		backgroundPosition?: string;
		backgroundRepeat?: string;
	};
	onLoad?: () => void;
	onError?: () => void;
	onLoading?: () => void;
	children?: React.ReactNode;
}

export function PreloadImage({
	src,
	lazy = true,
	duration = 300,
	ease = "cubic-bezier(0.215, 0.61, 0.355, 1)",
	innerStyle,
	className,
	style,
	onLoad,
	onError,
	onLoading,
	children,
	...rest
}: PreloadImageProps) {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const bgRef = useRef<HTMLDivElement | null>(null);
	const iconRef = useRef<HTMLDivElement | null>(null);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const imgRef = useRef<HTMLImageElement | null>(null);

	const doLoad = useCallback(() => {
		if (!src) return;
		if (typeof onLoading === "function") onLoading();
		if (bgRef.current) {
			bgRef.current.style.opacity = "0";
			bgRef.current.style.backgroundImage = `url(${src})`;
		}
		if (iconRef.current) iconRef.current.style.opacity = "1";
		imgRef.current = new Image();
		imgRef.current.onload = () => {
			if (bgRef.current) bgRef.current.style.opacity = "1";
			if (iconRef.current) iconRef.current.style.opacity = "0";
			onLoad?.();
		};
		imgRef.current.onerror = () => {
			if (bgRef.current) bgRef.current.style.opacity = "1";
			if (iconRef.current) iconRef.current.style.opacity = "0";
			onError?.();
		};
		imgRef.current.src = src;
	}, [src, onLoading, onLoad, onError]);

	const setupObserver = useCallback(() => {
		if (
			!lazy ||
			typeof window === "undefined" ||
			!("IntersectionObserver" in window)
		) {
			doLoad();
			return;
		}
		observerRef.current = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					doLoad();
					observerRef.current?.disconnect();
				}
			});
		});
		if (rootRef.current) observerRef.current.observe(rootRef.current);
	}, [lazy, doLoad]);

	useEffect(() => {
		setupObserver();
		return () => {
			observerRef.current?.disconnect();
			if (imgRef.current) imgRef.current.onload = null;
		};
	}, [setupObserver]);

	const bgSize = innerStyle?.backgroundSize ?? "cover";
	const bgPos = innerStyle?.backgroundPosition ?? "center";
	const bgRepeat = innerStyle?.backgroundRepeat ?? "no-repeat";

	return (
		<div
			ref={rootRef}
			className={`relative overflow-hidden ${className ?? ""}`}
			style={style}
			{...rest}
		>
			<div
				ref={bgRef}
				className="absolute inset-0 transition-opacity"
				style={{
					backgroundSize: bgSize,
					backgroundPosition: bgPos,
					backgroundRepeat: bgRepeat,
					opacity: 0,
					transitionProperty: "background-image, opacity",
					transitionDuration: `${duration}ms, ${duration}ms`,
					transitionTimingFunction: `${ease}, ${ease}`,
				}}
			/>
			<div
				ref={iconRef}
				className="absolute inset-0 flex items-center justify-center text-white/60 opacity-0 transition-opacity"
				style={{ transitionDuration: `${duration}ms` }}
			>
				<svg
					className="h-8 w-8 animate-pulse"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<circle cx="12" cy="12" r="10" className="opacity-25" />
					<path d="M12 6v6l4 2" />
				</svg>
			</div>
			{children}
		</div>
	);
}
