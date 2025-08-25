const fetchWrapper = (input, init = {}) => {
    // Always send cookies for App Router API routes; allow callers to override
    return fetch(input, { credentials: "include", ...init });
};

export default fetchWrapper;
