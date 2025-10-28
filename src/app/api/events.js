"use server";

import { sql } from "@vercel/postgres";

const columnOptions = ["id", "name", "slug", "description"];

export const getEvents = async ({ columns = columnOptions }) => {
    const validColumns = columns.filter((col) => columnOptions.includes(col));
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
