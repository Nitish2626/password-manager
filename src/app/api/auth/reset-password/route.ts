import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, getSessionCookieName, hashPassword, verifyPassword } from "@/lib/auth";
import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { writeAuditLog } from "@/lib/audit";
import { connectToDatabase } from "@/lib/db/mongoose";
import { resetPasswordSchema } from "@/lib/validators/password-security";
import { User } from "@/models/user";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(authUser.userId);

    if (!user) return unauthorizedResponse();

    const sameAsOld = await verifyPassword(parsed.data.newPassword, user.passwordHash);

    if (sameAsOld) {
      return NextResponse.json(
        { message: "New password must be different from current password" },
        { status: 400 },
      );
    }

    user.passwordHash = await hashPassword(parsed.data.newPassword);
    await user.save();

    const token = await createSessionToken(String(user._id), user.email);

    const response = NextResponse.json({ message: "Password reset successfully" });

    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await writeAuditLog(request, {
      userId: String(user._id),
      action: "auth.reset_password",
      detail: "Password reset while logged in",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to reset password", error: (error as Error).message },
      { status: 500 },
    );
  }
}

