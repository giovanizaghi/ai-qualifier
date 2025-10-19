import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { protectApiRoute, rateLimitConfigs, sanitizeInput } from "@/lib/api/middleware"
import { 
  createdResponse,
  handleApiError,
  conflictResponse
} from "@/lib/api/responses"
import { 
  validateRequestBody
} from "@/lib/api/validation"
import { prisma } from "@/lib/prisma"


// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
})

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for auth endpoints
    const protection = await protectApiRoute(req, {
      rateLimit: rateLimitConfigs.auth
    })
    
    if (!protection.success) {
      return protection.error
    }

    const body = await req.json()
    
    // Validate and sanitize request body
    const validatedData = validateRequestBody(registerSchema, body)
    const sanitizedName = sanitizeInput(validatedData.name)
    const sanitizedEmail = validatedData.email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (existingUser) {
      return conflictResponse("User with this email already exists")
    }

    // Hash password with strong settings
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        password: hashedPassword,
        role: "USER",
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })
    
    return createdResponse(newUser, "User created successfully")

  } catch (error) {
    return handleApiError(error)
  }
}