import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/auth";
import { slotSchema } from "@/lib/validations";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const { data: rows, errors } = Papa.parse<Record<string, string>>(
      csvText,
      {
        header: true,
        skipEmptyLines: true,
      }
    );

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV", details: errors },
        { status: 400 }
      );
    }

    let created = 0;
    let failed = 0;
    const failedRows: { row: number; errors: unknown }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const parsed = slotSchema.safeParse({
        serviceType: row.serviceType,
        startTime: row.startTime,
        endTime: row.endTime,
        capacity: row.capacity,
        bookedCount: row.bookedCount || "0",
        basePriceCents: row.basePriceCents,
      });

      if (!parsed.success) {
        failed++;
        failedRows.push({
          row: i + 1,
          errors: parsed.error.flatten().fieldErrors,
        });
        continue;
      }

      try {
        await prisma.slot.create({
          data: {
            businessId,
            serviceType: parsed.data.serviceType,
            startTime: new Date(parsed.data.startTime),
            endTime: new Date(parsed.data.endTime),
            capacity: parsed.data.capacity,
            bookedCount: parsed.data.bookedCount,
            basePriceCents: parsed.data.basePriceCents,
          },
        });
        created++;
      } catch {
        failed++;
        failedRows.push({
          row: i + 1,
          errors: { _: ["Database error creating slot"] },
        });
      }
    }

    return NextResponse.json({
      created,
      failed,
      total: rows.length,
      failedRows: failedRows.length > 0 ? failedRows : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Unauthorized" || message === "No business" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
