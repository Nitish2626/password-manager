import { NextRequest, NextResponse } from "next/server";

import { getAuthUserFromRequest, unauthorizedResponse } from "@/lib/auth-server";
import { writeAuditLog } from "@/lib/audit";
import { encryptValue } from "@/lib/crypto";
import { connectToDatabase } from "@/lib/db/mongoose";
import { passwordEntrySchema } from "@/lib/validators/password-entry";
import { PasswordEntry } from "@/models/password-entry";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = passwordEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const doc = await PasswordEntry.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      {
        username: parsed.data.username,
        folder: parsed.data.folder,
        tags: parsed.data.tags,
        lastRotatedAt: new Date(),
        encryptedPassword: encryptValue(parsed.data.password),
      },
      { new: true },
    );

    if (!doc) return NextResponse.json({ message: "Entry not found" }, { status: 404 });

    await writeAuditLog(request, {
      userId: authUser.userId,
      action: "credential.update",
      detail: `Updated credential for ${doc.username}`,
    });

    return NextResponse.json({
      entry: {
        id: String(doc._id),
        username: doc.username,
        folder: doc.folder,
        tags: doc.tags,
        lastRotatedAt: doc.lastRotatedAt,
        password: parsed.data.password,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to update entry", error: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authUser = await getAuthUserFromRequest(request);

    if (!authUser) return unauthorizedResponse();

    const { id } = await params;

    await connectToDatabase();

    const doc = await PasswordEntry.findOneAndDelete({ _id: id, userId: authUser.userId });

    if (!doc) return NextResponse.json({ message: "Entry not found" }, { status: 404 });

    await writeAuditLog(request, {
      userId: authUser.userId,
      action: "credential.delete",
      detail: `Deleted credential for ${doc.username}`,
    });

    return NextResponse.json({ message: "Entry deleted" });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to delete entry", error: (error as Error).message },
      { status: 500 },
    );
  }
}

