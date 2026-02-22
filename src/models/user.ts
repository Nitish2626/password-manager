import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

type UserDoc = InferSchemaType<typeof userSchema>;
type UserModel = Model<UserDoc>;

export const User =
  (models.User as UserModel | undefined) ?? model<UserDoc>("User", userSchema);

