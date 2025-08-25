import "@testing-library/jest-dom";

// Provide a conservative default global.fetch for components that fetch on mount in tests.
// Individual tests can override this as needed.
if (!global.fetch) {
	global.fetch = jest.fn((url, _options) => {
		const ok = true;
		if (typeof url === "string") {
			if (url.startsWith("/api/events")) {
				return Promise.resolve({ ok, json: async () => ({ events: [] }) });
			}
			if (url.startsWith("/api/comments")) {
				return Promise.resolve({ ok, json: async () => ({ comments: [] }) });
			}
		}
		return Promise.resolve({ ok, json: async () => ({}) });
	});
}
