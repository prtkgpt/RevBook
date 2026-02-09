import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBusiness, requireOwner } from "@/lib/auth";
import { customerSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireBusiness();
    const customers = await prisma.customer.findMany({
      where: { businessId: session.user.businessId! },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("List customers error:", error);
    return NextResponse.json({ error: "Failed to list customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner();
    const body = await req.json();
    const data = customerSchema.parse(body);

    if (data.email) {
      const existing = await prisma.customer.findFirst({
        where: {
          businessId: session.user.businessId!,
          email: data.email,
        },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A customer with this email already exists" },
          { status: 409 }
        );
      }
    }

    const customer = await prisma.customer.create({
      data: {
        businessId: session.user.businessId!,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        tags: data.tags || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
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
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
