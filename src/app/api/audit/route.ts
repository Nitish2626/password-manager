import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { AuditLog } from "@/models/audit-log";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const timeline = await AuditLog.find({ userId: authUser.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ timeline });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load timeline", error: (error as Error).message },
      { status: 500 },
    );
  }
}

