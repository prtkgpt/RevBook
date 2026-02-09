import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { scoreCustomers, getSegmentSummaries } from "@/lib/rfm-scoring";

export async function GET() {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;

    const [customers, segments] = await Promise.all([
      scoreCustomers(businessId),
      getSegmentSummaries(businessId),
    ]);

    return NextResponse.json({ customers, segments });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("RFM scoring error:", error);
    return NextResponse.json(
      { error: "Failed to generate RFM scores" },
      { status: 500 }
    );
  }
}
