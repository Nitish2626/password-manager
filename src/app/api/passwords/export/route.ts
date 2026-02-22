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

    const payload = docs.map((entry) => {
      const encrypted = entry.encryptedPassword;
      return {
        username: entry.username,
        password:
          encrypted && encrypted.iv && encrypted.authTag && encrypted.cipherText
            ? decryptValue(encrypted)
            : "",
        folder: entry.folder,
        tags: entry.tags,
        lastRotatedAt: entry.lastRotatedAt,
      };
    });

    const encryptedBackup = encryptValue(JSON.stringify(payload));

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      payload: JSON.stringify(encryptedBackup),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to export", error: (error as Error).message },
      { status: 500 },
    );
  }
}
