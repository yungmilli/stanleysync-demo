import { NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth";
import { saveWebsiteProject } from "@/features/websites/data";

export async function POST(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const project = await saveWebsiteProject(body);
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project save error", error);
    return NextResponse.json(
      { message: "Unable to save website project." },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const project = await saveWebsiteProject(body);
    return NextResponse.json({ project });
  } catch (error) {
    console.error("Project update error", error);
    return NextResponse.json(
      { message: "Unable to update website project." },
      { status: 400 },
    );
  }
}
