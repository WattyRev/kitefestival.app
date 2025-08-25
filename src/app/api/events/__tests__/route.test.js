import { sql } from "@vercel/postgres";
import { cookies } from "next/headers";
import { GET, POST, PATCH, DELETE } from "../route";
import { randomUUID } from "../../crypto";
import validatePasscode, {
  NoPasscodeError,
  InvalidPasscodeError,
} from "../../passcodes/validatePasscode";
import logUpdateByTableName from "../../logUpdate";

jest.mock("../../passcodes/validatePasscode");
jest.mock("../../crypto");
jest.mock("../../logUpdate");
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

describe("events/route", () => {
  let mockGetCookie;

  beforeEach(() => {
    mockGetCookie = jest.fn().mockReturnValue({ value: "pc" });
    cookies.mockReturnValue({ get: mockGetCookie });
    validatePasscode.mockReset();
    randomUUID.mockReset();
    sql.mockReset && sql.mockReset();
  });

  describe("GET", () => {
    it("lists events", async () => {
      sql.mockResolvedValueOnce({
        rows: [
          { id: "1", name: "A", description: null, start_date: null, end_date: null, location: null, is_active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
        ],
      });
      const res = await GET();
      const data = await res.json();
      expect(data.events[0]).toMatchObject({ id: "1", name: "A", isActive: true });
    });
  });

  describe("POST", () => {
    beforeEach(() => {
      validatePasscode.mockResolvedValue(true);
      randomUUID.mockReturnValue("uuid");
    });

    it("requires passcode", async () => {
      mockGetCookie.mockReturnValue(undefined);
      validatePasscode.mockRejectedValue(new NoPasscodeError());
      const req = { json: jest.fn().mockResolvedValue({ name: "A" }) };
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("requires unique name and creates event", async () => {
      // name check
      sql
        .mockResolvedValueOnce({ rows: [] }) // existing name check
        .mockResolvedValueOnce({ rows: [] }) // ensure table
        .mockResolvedValueOnce({ rows: [] }); // insert

      const req = { json: jest.fn().mockResolvedValue({ name: "Test", description: "d" }) };
      const res = await POST(req);
      const data = await res.json();
      expect(data.event).toMatchObject({ id: "uuid", name: "Test", isActive: false });
      expect(logUpdateByTableName).toHaveBeenCalledWith("events");
    });
  });

  describe("PATCH", () => {
    beforeEach(() => validatePasscode.mockResolvedValue(true));
    it("bulk patches events", async () => {
      const req = { json: jest.fn().mockResolvedValue({ events: [{ id: "1", name: "Edited" }] }) };
  sql.mockResolvedValue({ rows: [] });
  // Mock dynamic query updater
  sql.query = jest.fn().mockResolvedValue({ rows: [] });
      const res = await PATCH(req);
      expect(res.status).toBe(200);
      expect(logUpdateByTableName).toHaveBeenCalledWith("events");
    });
  });

  describe("DELETE", () => {
    beforeEach(() => validatePasscode.mockResolvedValue(true));
    it("deletes all events with snapshot", async () => {
      sql
        .mockResolvedValueOnce({ rows: [] }) // events snapshot
        .mockResolvedValueOnce({ rows: [] }) // activities snapshot
        .mockResolvedValueOnce({ rows: [] }) // comments snapshot
        .mockResolvedValueOnce({ rows: [] }) // delete comments
        .mockResolvedValueOnce({ rows: [] }) // delete activities
        .mockResolvedValueOnce({ rows: [] }); // delete events
      const res = await DELETE();
      const data = await res.json();
      expect(data.message).toMatch(/deleted successfully/i);
    });
  });
});
