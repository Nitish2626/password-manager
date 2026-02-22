import { NextRequest } from "next/server";

import { AuditLog } from "@/models/audit-log";

export async function writeAuditLog(
  request: NextRequest,
  data: { userId: string; action: string; detail?: string },
) {
  await AuditLog.create({
    userId: data.userId,
    action: data.action,
    detail: data.detail ?? "",
    ip: request.headers.get("x-forwarded-for") ?? "",
    userAgent: request.headers.get("user-agent") ?? "",
  });
}

