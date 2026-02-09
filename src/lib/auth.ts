import { NextAuthOptions, getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY || "",
        },
      },
      from: process.env.EMAIL_FROM || "noreply@example.com",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, businessId: true },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.businessId = dbUser.businessId;
          }
        } catch (error) {
          console.error("Failed to fetch user in JWT callback:", error);
          token.userId = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = (token.role as string) || "MEMBER";
        session.user.businessId = (token.businessId as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
};

export async function getSession() {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    console.error("getSession failed:", error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireBusiness() {
  const session = await requireAuth();
  if (!session.user.businessId) {
    throw new Error("No business");
  }
  return session;
}

export async function requireOwner() {
  const session = await requireBusiness();
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden");
  }
  return session;
}
