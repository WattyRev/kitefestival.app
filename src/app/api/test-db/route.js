import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
    try {
        // Simple query to test database connection
        const result = await sql`SELECT 1 as test`;
        return NextResponse.json({ 
            success: true, 
            message: "Database connection successful",
            data: result.rows 
        });
    } catch (error) {
        console.error("Database connection error:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Database connection failed",
                error: error.message 
            },
            { status: 500 }
        );
    }
}
