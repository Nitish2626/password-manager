import { NextRequest, NextResponse } from "next/server";

import { getSessionCookieName } from "@/lib/auth";
import { getAuthUserFromRequest } from "@/lib/auth-server";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const authUser = await getAuthUserFromRequest(request);

  if (authUser) {
    await writeAuditLog(request, {
      userId: authUser.userId,
      action: "auth.logout",
      detail: "User logged out",
    });
  }

  const response = NextResponse.json({ message: "Logged out" });

  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

