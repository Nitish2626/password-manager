import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, getSessionCookieName, hashPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db/mongoose";
import { authSchema } from "@/lib/validators/auth";
import { User } from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await User.findOne({ email: parsed.data.email.toLowerCase() }).lean();

    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await User.create({
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });

    const token = await createSessionToken(String(user._id), user.email);

    const response = NextResponse.json({
      user: { userId: String(user._id), email: user.email },
    });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await writeAuditLog(request, {
      userId: String(user._id),
      action: "auth.register",
      detail: "User registered",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Registration failed", error: (error as Error).message },
      { status: 500 },
    );
  }
}

