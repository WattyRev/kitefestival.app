const mockJson = (data, status) => {
    return { data, ...status};
};

export const NextResponse = {
    json: mockJson
};