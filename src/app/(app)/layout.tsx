import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  // Check if user has a business (DB is source of truth, JWT may be stale)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { businessId: true },
  });

  const hasBusiness = !!dbUser?.businessId;

  if (!hasBusiness) {
    // No nav for onboarding flow
    return (
      <div className="min-h-screen bg-gray-50/50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
