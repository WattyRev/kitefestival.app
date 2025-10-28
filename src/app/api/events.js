"use server";

import { sql } from "@vercel/postgres";

const COLUMN_OPTIONS = ["id", "name", "slug", "description"];

export const getEvents = async ({ columns = COLUMN_OPTIONS }) => {
    const validColumns = columns.filter((col) => COLUMN_OPTIONS.includes(col));
    if (!validColumns.length) {
        throw new Error("No valid columns requested");
    }
    const response = await sql.query(
        `SELECT ${validColumns.join(", ")} FROM events`,
    );

    return response.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
    }));
};
