import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { getSessionCookieName, verifySessionToken } from "@/lib/auth";

export async function getAuthUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;

  if (!token) {
    return null;
  }

  try {
    const user = await verifySessionToken(token);

    if (!Types.ObjectId.isValid(user.userId)) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}
