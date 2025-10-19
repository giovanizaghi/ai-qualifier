import NextAuth, { type DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role?: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: string
  }
}

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Mock user store (replace with database later)
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    password: "$2a$10$F7q8f8f8f8f8f8f8f8f8fuLZb8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8", // "password123"
    role: "admin",
  },
  {
    id: "2", 
    email: "user@example.com",
    name: "Test User",
    password: "$2a$10$F7q8f8f8f8f8f8f8f8f8fuLZb8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8", // "password123"
    role: "user",
  },
]

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials
          const { email, password } = credentialsSchema.parse(credentials)

          // Find user in mock store (replace with database query)
          const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())

          if (!user || !user.password) {
            return null
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(password, user.password)
          if (!passwordMatch) {
            return null
          }

          // Return user object
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error) {
          console.error("Authorization error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.role = user.role || "user"
      }

      // Handle session updates
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = (token.role as string) || "user"
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow OAuth providers
      if (account?.provider !== "credentials") {
        return true
      }

      // For credentials, user was already validated in authorize
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  events: {
    async createUser({ user }) {
      console.log(`New user created: ${user.email}`)
    },
    async signIn({ user, account }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
    },
  },
  debug: process.env.NODE_ENV === "development",
})