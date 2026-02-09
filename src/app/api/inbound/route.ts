import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required
export async function POST(req: NextRequest) {
  try {
    const { name, email, company, phone, message, source } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const lead = await prisma.inboundLead.create({
      data: {
        name,
        email,
        company: company || null,
        phone: phone || null,
        message: message || null,
        source: source || "website",
      },
    });

    return NextResponse.json({ id: lead.id, success: true }, { status: 201 });
  } catch (error) {
    console.error("Inbound lead error:", error);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}
