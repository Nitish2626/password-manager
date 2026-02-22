import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const auditLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, trim: true },
    detail: { type: String, default: "", trim: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true },
);

type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;
type AuditLogModel = Model<AuditLogDoc>;

export const AuditLog =
  (models.AuditLog as AuditLogModel | undefined) ??
  model<AuditLogDoc>("AuditLog", auditLogSchema);

