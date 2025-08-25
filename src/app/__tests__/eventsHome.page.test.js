import { sql } from "@vercel/postgres";
import EventsHome from "../page";
import { render } from "@testing-library/react";

jest.mock("@vercel/postgres", () => ({ sql: jest.fn() }));

describe("EventsHome page", () => {
  it("renders empty state", async () => {
    sql.mockResolvedValueOnce({ rows: [] });
    const ui = await EventsHome();
    const { getByText } = render(ui);
    expect(getByText(/No events yet/i)).toBeInTheDocument();
  });

  it("renders list of events", async () => {
    sql.mockResolvedValueOnce({ rows: [{ id: "e1", name: "Fest", description: "", start_date: null, end_date: null, location: "", is_active: true }] });
    const ui = await EventsHome();
    const { getByText } = render(ui);
    expect(getByText(/Fest/)).toBeInTheDocument();
  });
});
