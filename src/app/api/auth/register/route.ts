import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"

// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Mock user store (replace with database later)
const mockUsers: Array<{
  id: string
  name: string
  email: string
  password: string
  role: string
  createdAt: Date
}> = []

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request body
    const { name, email, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = mockUsers.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user
    const newUser = {
      id: Math.random().toString(36).substring(2),
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
    }

    // Add to mock store (replace with database save)
    mockUsers.push(newUser)

    // Return success response (don't include password)
    const { password: _, ...userWithoutPassword } = newUser
    
    return NextResponse.json(
      { 
        message: "User created successfully", 
        user: userWithoutPassword 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}