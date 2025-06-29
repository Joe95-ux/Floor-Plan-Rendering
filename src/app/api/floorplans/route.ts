import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  const floorPlans = await prisma.floorPlan.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(floorPlans);
}

export async function POST(req: NextRequest) {
  const { projectId, name, imageUrl, metadata } = await req.json();
  if (!projectId || !name || !imageUrl) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const floorPlan = await prisma.floorPlan.create({
    data: { projectId, name, imageUrl, metadata },
  });
  return NextResponse.json(floorPlan);
} 