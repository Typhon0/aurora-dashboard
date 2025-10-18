import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MockHassProvider, type MockEntityInit } from "./mockHass";

interface RenderAuroraOptions {
	entities?: MockEntityInit[];
	onCallService?: (args: {
		domain: string;
		service: string;
		target?: string | string[];
	}) => void;
}

export function renderAurora(
	ui: ReactElement,
	options: RenderAuroraOptions = {},
) {
	const { entities, onCallService } = options;
	return render(
		<MockHassProvider entities={entities} onCallService={onCallService}>
			{ui}
		</MockHassProvider>,
	);
}
