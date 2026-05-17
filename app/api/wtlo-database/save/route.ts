import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const database = await request.json();

    const fileContent = `const WTLO_DATABASE_DATA = ${JSON.stringify(database, null, 2)} as const;\n\nexport default WTLO_DATABASE_DATA;\n`;

    const filePath = path.join(process.cwd(), "src", "data", "wtlo-database-data.ts");
    await writeFile(filePath, fileContent, "utf8");

    return NextResponse.json({
      success: true,
      message: "WTLO database saved to src/data/wtlo-database-data.ts",
    });
  } catch (error) {
    console.error("Failed to save WTLO database:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to save WTLO database. Check the terminal for details.",
      },
      { status: 500 }
    );
  }
}
