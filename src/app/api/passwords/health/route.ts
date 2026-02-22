import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { decryptValue, encryptValue } from "@/lib/crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PasswordEntry } from "@/models/password-entry";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    await connectToDatabase();

    const docs = await PasswordEntry.find({ userId: authUser.userId }).lean();
    const now = Date.now();
    const seen = new Map<string, number>();

    let weak = 0;
    let old = 0;

    for (const doc of docs) {
      const encrypted = doc.encryptedPassword;
      const password =
        encrypted && encrypted.iv && encrypted.authTag && encrypted.cipherText
          ? decryptValue(encrypted)
          : "";
      if (password.length < 12) weak++;
      if (doc.lastRotatedAt && now - new Date(doc.lastRotatedAt).getTime() > 1000 * 60 * 60 * 24 * 90) {
        old++;
      }
      seen.set(password, (seen.get(password) ?? 0) + 1);
    }

    const reused = Array.from(seen.values()).filter((count) => count > 1).length;

    return NextResponse.json({
      health: {
        total: docs.length,
        weak,
        reused,
        old,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to load health", error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const body = (await request.json()) as { password?: string };
    if (!body.password) {
      return NextResponse.json({ message: "Password is required" }, { status: 400 });
    }

    return NextResponse.json({ encrypted: encryptValue(body.password) });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed request", error: (error as Error).message },
      { status: 500 },
    );
  }
}
