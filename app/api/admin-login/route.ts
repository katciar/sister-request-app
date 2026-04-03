import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const password = body?.password;

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "ADMIN_PASSWORD is not set." },
      { status: 500 }
    );
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, message: "Incorrect password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("admin_auth", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}