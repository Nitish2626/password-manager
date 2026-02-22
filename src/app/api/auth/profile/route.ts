import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { User } from "@/models/user";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const user = await User.findById(authUser.userId).lean();

    if (!user) return unauthorizedResponse();

    return NextResponse.json({
      profile: {
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load profile", error: (error as Error).message },
      { status: 500 },
    );
  }
}

