import Link from "next/link";
import { sql } from "@vercel/postgres";
import { css } from "../../styled-system/css";

export const revalidate = 0;

export default async function EventsHome() {
    const eventsResponse = await sql`SELECT * FROM events ORDER BY created_at DESC`;
    const events = eventsResponse.rows.map((event) => ({
        id: event.id,
        name: event.name,
        description: event.description,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        isActive: event.is_active,
    }));

    return (
        <div className={css({ padding: { base: "12px", sm: "16px" }, maxWidth: "900px", margin: "0 auto" })}>
            <h1 className={css({ fontSize: { base: "22px", sm: "28px" }, fontWeight: 700, marginBottom: "16px" })}>
                Events
            </h1>

            {events.length === 0 ? (
                <p>No events yet. Create one in Configuration → Events.</p>
            ) : (
                <div className={css({ display: "flex", flexDirection: "column", gap: "12px" })}>
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={`/events/${event.id}`}
                            className={css({
                                display: "block",
                                padding: "16px",
                                border: "1px solid",
                                borderColor: event.isActive ? "blue.300" : "gray.200",
                                backgroundColor: event.isActive ? "blue.50" : "white",
                                borderRadius: "10px",
                                textDecoration: "none",
                                color: "inherit",
                                transition: "transform 0.1s ease, box-shadow 0.1s ease",
                                "&:hover": { transform: "scale(1.01)", boxShadow: "md" },
                            })}
                        >
                            <div className={css({ display: "flex", justifyContent: "space-between", alignItems: "center" })}>
                                <div>
                                    <div className={css({ fontSize: "18px", fontWeight: 700 })}>
                                        {event.isActive ? "🎪 " : ""}
                                        {event.name}
                                    </div>
                                    {event.description && (
                                        <div className={css({ color: "gray.600", marginTop: "4px" })}>
                                            {event.description}
                                        </div>
                                    )}
                                    <div className={css({ display: "flex", gap: "12px", color: "gray.500", fontSize: "12px", marginTop: "6px" })}>
                                        {event.location && <span>📍 {event.location}</span>}
                                        {event.startDate && <span>🗓️ {new Date(event.startDate).toLocaleDateString()}</span>}
                                        {event.endDate && <span>⏰ Ends {new Date(event.endDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                <span className={css({ fontSize: "12px", color: "blue.700", fontWeight: 600 })}>
                                    View →
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
