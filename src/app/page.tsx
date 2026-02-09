import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function Home() {
  let hasSession = false;

  try {
    const session = await getSession();
    hasSession = !!session?.user;
  } catch (error) {
    console.error("Session check failed:", error);
  }

  if (hasSession) {
    redirect("/app");
  }

  redirect("/signin");
}
