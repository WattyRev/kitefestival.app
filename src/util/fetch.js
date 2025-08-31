// Simple in-memory cache for GET requests keyed by URL
const etagCache = new Map(); // url -> { etag, bodyText, headers }

const toUrlKey = (input) => {
    try {
        if (typeof input === "string") return input;
        if (input && typeof input.url === "string") return input.url;
    } catch {}
    return String(input || "");
};

const mergeHeaders = (base = {}, extra = {}) => {
    const h = new Headers(base);
    for (const [k, v] of Object.entries(extra)) h.set(k, v);
    return h;
};

// Safe header getter that supports both Headers objects and plain objects
const getHeader = (headers, name) => {
    if (!headers) return undefined;
    const target = String(name);
    if (typeof headers.get === "function") {
        return headers.get(target) || headers.get(target.toLowerCase()) || undefined;
    }
    if (typeof headers === "object") {
        // case-insensitive lookup on plain objects
        const lower = target.toLowerCase();
        for (const [k, v] of Object.entries(headers)) {
            if (k === target || k.toLowerCase() === lower) return v;
        }
    }
    return undefined;
};

const fetchWrapper = async (input, init = {}) => {
    const method = (init.method || (typeof input !== "string" && input?.method) || "GET").toUpperCase();
    const urlKey = toUrlKey(input);

    // Default credentials include to send cookies for auth-protected APIs
    const baseInit = { credentials: "include", ...init };

    // Only apply ETag flow for GET requests to same-origin API routes
    let finalInit = baseInit;
    if (method === "GET" && urlKey.startsWith("/")) {
        const cached = etagCache.get(urlKey);
        if (cached?.etag) {
            finalInit = {
                ...baseInit,
                headers: mergeHeaders(baseInit.headers, { "If-None-Match": cached.etag }),
            };
        }
    }

    const res = await fetch(input, finalInit);

    if (method === "GET" && urlKey.startsWith("/")) {
        // If 304 and we have a cached body, synthesize a 200 Response with cached content
        const cached = etagCache.get(urlKey);
        if (res.status === 304 && cached?.bodyText) {
            return new Response(cached.bodyText, {
                status: 200,
                headers: mergeHeaders({ "Content-Type": getHeader(cached.headers, "Content-Type") || "application/json" }, {
                    ETag: cached.etag,
                    "X-Cache": "HIT",
                }),
            });
        }

        // On 200, store ETag and body for future conditional requests
        const etag = getHeader(res.headers, "ETag");
        if (etag) {
            try {
                const clone = res.clone();
                const bodyText = await clone.text();
                etagCache.set(urlKey, { etag, bodyText, headers: res.headers });
            } catch {
                // ignore caching errors
            }
        }
    }

    return res;
};

export default fetchWrapper;
