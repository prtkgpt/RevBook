import { NextAuthOptions, getServerSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { Adapter } from "next-auth/adapters";
import { Resend } from "resend";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.error("RESEND_API_KEY is not set");
          throw new Error("Email service not configured");
        }

        const resend = new Resend(apiKey);

        try {
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "onboarding@resend.dev",
            to: email,
            subject: "Sign in to RevBook",
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="display: inline-block; background: #4f46e5; border-radius: 12px; padding: 12px; margin-bottom: 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0;">RevBook</h1>
                </div>
                <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                  Click the button below to sign in to your account. This link expires in 24 hours.
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${url}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                    Sign in to RevBook
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 13px; line-height: 20px;">
                  If you didn't request this email, you can safely ignore it.
                </p>
              </div>
            `,
          });
        } catch (error) {
          console.error("Failed to send verification email:", error);
          throw new Error("Failed to send verification email");
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Refresh from DB on sign-in, session update, or if businessId is missing
      if (user || trigger === "update" || !token.businessId) {
        try {
          const id = (user?.id as string) || (token.userId as string);
          const dbUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true, businessId: true },
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.role = dbUser.role;
            token.businessId = dbUser.businessId;
          }
        } catch (error) {
          console.error("Failed to fetch user in JWT callback:", error);
          if (user) token.userId = user.id;
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
  // Check DB directly — JWT businessId may be stale after onboarding
  let businessId = session.user.businessId;
  if (!businessId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { businessId: true },
    });
    businessId = dbUser?.businessId ?? null;
    if (businessId) {
      session.user.businessId = businessId;
    }
  }
  if (!businessId) {
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
