import { NextResponse } from "next/server";
import { requireBusiness } from "@/lib/auth";
import { forecastSlots, getDemandInsights } from "@/lib/demand-forecast";

export async function GET() {
  try {
    const session = await requireBusiness();
    const businessId = session.user.businessId!;

    const [forecasts, insights] = await Promise.all([
      forecastSlots(businessId),
      getDemandInsights(businessId),
    ]);

    return NextResponse.json({ forecasts, insights });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "No business") {
      return NextResponse.json({ error: "No business" }, { status: 403 });
    }
    console.error("Demand forecast error:", error);
    return NextResponse.json(
      { error: "Failed to generate demand forecast" },
      { status: 500 }
    );
  }
}
