import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock WebSocket pour les tests
global.WebSocket = vi.fn().mockImplementation(() => ({
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	send: vi.fn(),
	close: vi.fn(),
}));
