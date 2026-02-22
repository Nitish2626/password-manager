import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { decryptValue, encryptValue } from "@/lib/crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { passwordImportSchema } from "@/lib/validators/password-entry";
import { PasswordEntry } from "@/models/password-entry";

type ImportItem = {
  username: string;
  password: string;
  folder?: string;
  tags?: string[];
  lastRotatedAt?: string;
};

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const body = await request.json();
    const parsed = passwordImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid import payload" }, { status: 400 });
    }

    const parsedPayload = JSON.parse(parsed.data.payload) as {
      iv: string;
      authTag: string;
      cipherText: string;
    };

    const plain = decryptValue(parsedPayload);
    const items = JSON.parse(plain) as ImportItem[];

    if (!Array.isArray(items)) {
      return NextResponse.json({ message: "Invalid backup format" }, { status: 400 });
    }

    await connectToDatabase();

    for (const item of items) {
      if (!item.username || !item.password) continue;
      await PasswordEntry.create({
        userId: authUser.userId,
        username: item.username,
        folder: item.folder ?? "General",
        tags: item.tags ?? [],
        lastRotatedAt: item.lastRotatedAt ? new Date(item.lastRotatedAt) : new Date(),
        encryptedPassword: encryptValue(item.password),
      });
    }

    return NextResponse.json({ message: "Import complete", imported: items.length });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to import", error: (error as Error).message },
      { status: 500 },
    );
  }
}

