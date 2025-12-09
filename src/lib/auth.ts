
import CredentialsProvider from "next-auth/providers/credentials"
import dbConnect from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please provide email and password');
                }

                // 1. Admin Override Check
                if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
                    return {
                        id: 'admin_static_id',
                        name: 'System Admin',
                        email: ADMIN_EMAIL,
                        role: 'admin',
                        status: 'approved'
                    };
                }

                await dbConnect();

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    throw new Error('No user found');
                }

                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    throw new Error('Invalid password');
                }

                if (user.status !== 'approved') {
                    throw new Error('Account pending approval. Please contact administrator.');
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                };
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                // @ts-ignore
                token.role = user.role;
                // @ts-ignore
                token.status = user.status;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
                // @ts-ignore
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
}
