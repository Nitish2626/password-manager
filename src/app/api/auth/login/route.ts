import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, getSessionCookieName, verifyPassword } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db/mongoose";
import { authSchema } from "@/lib/validators/auth";
import { User } from "@/models/user";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = authSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    if (user.lockoutUntil && new Date(user.lockoutUntil).getTime() > Date.now()) {
      const seconds = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { message: `Account temporarily locked. Try again in ${seconds}s.` },
        { status: 429 },
      );
    }

    const isValid = await verifyPassword(parsed.data.password, user.passwordHash);

    if (!isValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      }

      await user.save();

      await writeAuditLog(request, {
        userId: String(user._id),
        action: "auth.login_failed",
        detail: "Invalid credentials",
      });

      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = null;
    await user.save();

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
      action: "auth.login_success",
      detail: "Login successful",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Login failed", error: (error as Error).message },
      { status: 500 },
    );
  }
}

