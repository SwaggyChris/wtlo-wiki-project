import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

const allowedCategories = new Set([
  "items",
  "weapons",
  "ammo",
  "armor",
  "medicine",
  "premium",
  "crafting",
  "bestiary",
  "characters",
  "guides",
  "achievements",
  "general",
]);

const makeSafeFileName = (fileName: string) => {
  const parts = fileName.split(".");
  const extension = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts.join(".") || fileName;

  return `${base
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")}${extension}`;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const categoryValue = String(formData.get("category") || "items").toLowerCase();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "No image file was uploaded." },
        { status: 400 }
      );
    }

    if (!allowedCategories.has(categoryValue)) {
      return NextResponse.json(
        { success: false, message: `Invalid image category: ${categoryValue}` },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "Only image files are allowed." },
        { status: 400 }
      );
    }

    const fileName = makeSafeFileName(file.name);
    const uploadDir = path.join(process.cwd(), "public", "db-assets", categoryValue);
    const destination = path.join(uploadDir, fileName);

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(destination, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      fileName,
      publicPath: `/db-assets/${categoryValue}/${fileName}`,
    });
  } catch (error) {
    console.error("Failed to save WTLO image:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save image into public/db-assets. Check the terminal for details.",
      },
      { status: 500 }
    );
  }
}
