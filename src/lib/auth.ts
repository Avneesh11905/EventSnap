import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                role: { label: "Role", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                const email = credentials.email.toLowerCase();
                const password = credentials.password;

                // 2. User logic
                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    // Sign up
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const username = (email.split("@")[0] ?? "user") + "_" + Date.now().toString(36);
                    
                    user = await prisma.user.create({
                        data: {
                            full_name: email.split("@")[0] || "User",
                            username,
                            email,
                            provider: "credentials",
                            role: credentials.role === "organizer" ? "organizer" : "attendee",
                            password: hashedPassword,
                        }
                    });
                } else {
                    // Sign in - check password
                    if (!user.password) {
                        throw new Error("Please log in with Google");
                    }
                    const isValid = await bcrypt.compare(password, user.password);
                    if (!isValid) {
                        throw new Error("Invalid password");
                    }
                }

                return { id: user.id, email: user.email, name: user.full_name, role: user.role };
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            try {
                if (account?.provider === "credentials") {
                    return true;
                }

                const email = user.email?.toLowerCase();
                if (!email || !account) {
                    console.error("[AUTH] signIn denied: missing email or account", { email, account });
                    return false;
                }

                // Check if user already exists
                const existingUser = await prisma.user.findUnique({
                    where: { email },
                    select: { id: true, image: true },
                });

                if (existingUser) {
                    if (user.image && existingUser.image !== user.image) {
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { image: user.image },
                        });
                    }
                    return true;
                }

                const username =
                    (email.split("@")[0] ?? "") + "_" + Date.now().toString(36);

                await prisma.user.create({
                    data: {
                        full_name: user.name || "User",
                        username,
                        email,
                        provider: account.provider,
                        image: user.image || "",
                        role: "attendee",
                    },
                });

                return true;
            } catch (err) {
                console.error("[AUTH] SignIn callback error:", err);
                return false;
            }
        },

        async jwt({ token, user, trigger }) {
            try {
                if (user || trigger === "update") {
                    const email = (user?.email || token.email as string)?.toLowerCase();
                    const dbUser = await prisma.user.findUnique({
                        where: { email },
                        select: { id: true, username: true, role: true, has_encoding: true },
                    });

                    if (dbUser) {
                        token.userId = dbUser.id;
                        token.username = dbUser.username;
                        token.role = dbUser.role ?? "attendee";
                        token.hasEncoding = dbUser.has_encoding ?? false;
                    }
                }
            } catch (err) {
                console.error("[AUTH] JWT callback error:", err);
            }
            return token;
        },

        async session({ session, token }) {
            try {
                if (session.user) {
                    session.user.id = token.userId as string;
                    session.user.username = token.username;
                    session.user.role = token.role ?? "attendee";
                    session.user.hasEncoding = token.hasEncoding ?? false;
                }
            } catch (err) {
                console.error("[AUTH] Session callback error:", err);
            }
            return session;
        },
    },

    pages: {
        signIn: "/signin",
        error: "/signin",
    },

    session: {
        strategy: "jwt",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },

    secret: process.env.NEXTAUTH_SECRET,
};
