import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { GET, PATCH, DELETE } from "../route";
import validatePasscode, { NoPasscodeError, InvalidPasscodeError } from "../../../passcodes/validatePasscode";
import logUpdateByTableName from "../../../logUpdate";

jest.mock("../../../passcodes/validatePasscode");
jest.mock("../../../logUpdate");
jest.mock("next/headers");

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data, options = {}) => ({
      json: async () => data,
      status: options.status || 200,
      ...data,
    }),
  },
}));

describe("events/[eventId]/route", () => {
  beforeEach(() => {
    cookies.mockReturnValue({ get: jest.fn().mockReturnValue({ value: "pc" }) });
  });

  it("GET returns event or 404", async () => {
    sql.mockResolvedValueOnce({ rows: [] });
    let res = await GET(null, { params: { eventId: "e1" } });
    expect(res.status).toBe(404);

    sql.mockResolvedValueOnce({ rows: [{ id: "e1", name: "Test", description: null, start_date: null, end_date: null, location: null, is_active: false, created_at: "", updated_at: "" }] });
    res = await GET(null, { params: { eventId: "e1" } });
    const data = await res.json();
    expect(data.event).toMatchObject({ id: "e1", name: "Test" });
  });

  it("PATCH updates fields and logs", async () => {
    validatePasscode.mockResolvedValue(true);
    // existing event
    sql
      .mockResolvedValueOnce({ rows: [{ id: "e1" }] }) // exists
      .mockResolvedValueOnce({ rows: [] }) // name check
      .mockResolvedValueOnce({ rows: [{ id: "e1", name: "Edited", description: null, start_date: null, end_date: null, location: null, is_active: false, created_at: "", updated_at: "" }] });

    // Mock UPDATE query returning updated row
    sql.query = jest.fn().mockResolvedValue({ rows: [{ id: "e1", name: "Edited", description: null, start_date: null, end_date: null, location: null, is_active: false, created_at: "", updated_at: "" }] });

    const req = { json: jest.fn().mockResolvedValue({ name: "Edited" }) };
    const res = await PATCH(req, { params: { eventId: "e1" } });
    const data = await res.json();
    expect(data.event).toMatchObject({ id: "e1", name: "Edited" });
    expect(logUpdateByTableName).toHaveBeenCalledWith("events");
  });

  it("DELETE removes event and related data", async () => {
    validatePasscode.mockResolvedValue(true);
    sql
      .mockResolvedValueOnce({ rows: [{ id: "e1", name: "X", is_active: false, start_date: null, end_date: null, location: null, description: null, created_at: "", updated_at: "" }] }) // get event
      .mockResolvedValueOnce({ rows: [] }) // activities
      .mockResolvedValueOnce({ rows: [] }) // comments
      .mockResolvedValueOnce({ rows: [] }) // del comments
      .mockResolvedValueOnce({ rows: [] }) // del activities
      .mockResolvedValueOnce({ rows: [] }) // del event
      .mockResolvedValueOnce({ rows: [] }) // log updates
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await DELETE(null, { params: { eventId: "e1" } });
    const data = await res.json();
    expect(data.message).toMatch(/deleted successfully/i);
  });
});
