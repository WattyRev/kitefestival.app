import "@testing-library/jest-dom";

if (!global.fetch) {
	global.fetch = jest.fn((url) => {
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
