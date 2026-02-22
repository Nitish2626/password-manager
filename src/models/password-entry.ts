import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const passwordEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    username: { type: String, required: true, trim: true },
    folder: { type: String, default: "General", trim: true },
    tags: { type: [String], default: [] },
    lastRotatedAt: { type: Date, default: Date.now },
    encryptedPassword: {
      iv: { type: String, required: true },
      authTag: { type: String, required: true },
      cipherText: { type: String, required: true },
    },
  },
  { timestamps: true },
);

type PasswordEntryDoc = InferSchemaType<typeof passwordEntrySchema>;
type PasswordEntryModel = Model<PasswordEntryDoc>;

const MODEL_NAME = "PasswordEntry";

if (mongoose.models[MODEL_NAME]) {
  delete mongoose.models[MODEL_NAME];
}

export const PasswordEntry = mongoose.model<PasswordEntryDoc>(
  MODEL_NAME,
  passwordEntrySchema,
) as PasswordEntryModel;

