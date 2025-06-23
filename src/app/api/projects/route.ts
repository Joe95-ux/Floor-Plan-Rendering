import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  const projects = await prisma.project.findMany({
    where: { userId },
    include: { floorPlans: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { name, userId } = await req.json();
  if (!name || !userId) return NextResponse.json({ error: "Missing name or userId" }, { status: 400 });
  const project = await prisma.project.create({
    data: { name, userId },
  });
  return NextResponse.json(project);
} 