import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({ message: "Hello, world!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}