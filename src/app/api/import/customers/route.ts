import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();
    const businessId = session.user.businessId!;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have a header row and at least one data row" },
        { status: 400 }
      );
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = header.indexOf("name");
    const emailIdx = header.indexOf("email");
    const phoneIdx = header.indexOf("phone");
    const tagsIdx = header.indexOf("tags");

    if (nameIdx === -1) {
      return NextResponse.json(
        { error: "CSV must have a 'name' column" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      const name = cols[nameIdx] || "";
      const email = emailIdx !== -1 ? cols[emailIdx] || "" : "";
      const phone = phoneIdx !== -1 ? cols[phoneIdx] || "" : "";
      const tags = tagsIdx !== -1 ? cols[tagsIdx] || "" : "";

      if (!name) {
        skipped++;
        continue;
      }

      if (email) {
        const existing = await prisma.customer.findFirst({
          where: { businessId, email },
        });
        if (existing) {
          skipped++;
          continue;
        }
      }

      await prisma.customer.create({
        data: {
          businessId,
          name,
          email: email || null,
          phone: phone || null,
          tags: tags || null,
        },
      });

      imported++;
    }

    return NextResponse.json({ imported, skipped });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("Import customers error:", error);
    return NextResponse.json({ error: "Failed to import customers" }, { status: 500 });
  }
}
