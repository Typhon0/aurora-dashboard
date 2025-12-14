export const monitorVitePerformance = () => {
	if (import.meta.env.DEV) {
		const observer = new PerformanceObserver((list) => {
			list.getEntries().forEach((entry) => {
				if (entry.duration > 100) {
					console.warn(`🐌 Vite: ${entry.name} took ${entry.duration}ms`);
				}
			});
		});

		observer.observe({ entryTypes: ["navigation", "resource"] });
	}
};
