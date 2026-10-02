import { db } from "@/utils/db";

export async function GET() {
  // Development diagnostic only; production should not describe its database to the public.
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  try {
    const result = await db.query("SELECT NOW() AS current_time, current_database() AS database");

    return Response.json({
      success: true,
      database: result.rows[0].database,
      time: result.rows[0].current_time,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return Response.json(
      {
        success: false,
        error: "Database connection failed",
      },
      { status: 500 }
    );
  }
}