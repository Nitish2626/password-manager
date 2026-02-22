import { NextResponse } from "next/server";

type GeneratorOptions = {
  length?: number;
  useUppercase?: boolean;
  useLowercase?: boolean;
  useNumbers?: boolean;
  useSymbols?: boolean;
};

function generatePassword(options: Required<GeneratorOptions>) {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const numbers = "23456789";
  const symbols = "!@#$%^&*()_-+=[]{}?";

  let pool = "";

  if (options.useUppercase) pool += uppercase;
  if (options.useLowercase) pool += lowercase;
  if (options.useNumbers) pool += numbers;
  if (options.useSymbols) pool += symbols;

  if (!pool) {
    pool = lowercase + numbers;
  }

  return Array.from({ length: options.length })
    .map(() => pool[Math.floor(Math.random() * pool.length)])
    .join("");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeneratorOptions;

    const options: Required<GeneratorOptions> = {
      length: Math.max(8, Math.min(64, body.length ?? 16)),
      useUppercase: body.useUppercase ?? true,
      useLowercase: body.useLowercase ?? true,
      useNumbers: body.useNumbers ?? true,
      useSymbols: body.useSymbols ?? true,
    };

    const password = generatePassword(options);

    return NextResponse.json({ password, options });
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
}
