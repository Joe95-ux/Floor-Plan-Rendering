import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
// import AWS from "aws-sdk"; // Uncomment for S3

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // Save locally
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, file.name);
  await fs.writeFile(filePath, buffer);
  const fileUrl = `/uploads/${file.name}`;

  /*
  // S3 upload example (commented out)
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET!,
    Key: file.name,
    Body: buffer,
    ContentType: file.type,
  };
  await s3.upload(s3Params).promise();
  const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${file.name}`;
  */

  return NextResponse.json({ url: fileUrl });
} 