import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type ApiError = {
  message?: string;
};

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "wtlo-database-data.ts");

export async function POST(request: NextRequest) {
  try {
    const database = await request.json();

    if (!database || typeof database !== "object" || Array.isArray(database)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid database payload. Expected a database object.",
        },
        { status: 400 }
      );
    }

    const fileContent = `const WTLO_DATABASE_DATA = ${JSON.stringify(database, null, 2)} as const;\n\nexport default WTLO_DATABASE_DATA;\n`;

    await mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
    await writeFile(DATA_FILE_PATH, fileContent, "utf8");

    return NextResponse.json({
      success: true,
      message: "WTLO database saved to src/data/wtlo-database-data.ts",
    });
  } catch (error) {
    const apiError = error as ApiError;
    console.error("Failed to save WTLO database:", error);

    return NextResponse.json(
      {
        success: false,
        message: apiError?.message || "Failed to save WTLO database. Check the terminal for details.",
      },
      { status: 500 }
    );
  }
}
