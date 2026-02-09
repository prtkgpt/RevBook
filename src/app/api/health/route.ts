import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check DATABASE_URL is set
  checks.database_url = process.env.DATABASE_URL ? "set" : "MISSING";

  // Check NEXTAUTH_SECRET is set
  checks.nextauth_secret = process.env.NEXTAUTH_SECRET ? "set" : "MISSING";

  // Check NEXTAUTH_URL is set
  checks.nextauth_url = process.env.NEXTAUTH_URL || "MISSING";

  // Check RESEND_API_KEY is set
  checks.resend_api_key = process.env.RESEND_API_KEY ? "set" : "MISSING";

  // Check EMAIL_FROM is set
  checks.email_from = process.env.EMAIL_FROM || "MISSING";

  // Try database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database_connection = "ok";
  } catch (error) {
    checks.database_connection = `FAILED: ${error instanceof Error ? error.message : String(error)}`;
  }

  const allOk = !Object.values(checks).some(
    (v) => v === "MISSING" || v.startsWith("FAILED")
  );

  return NextResponse.json(
    { status: allOk ? "healthy" : "unhealthy", checks },
    { status: allOk ? 200 : 500 }
  );
}
