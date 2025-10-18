import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).slice(2);
    const timestamp = new Date().toISOString();
    
    // Save to a simple JSON file
    const filePath = path.join(process.cwd(), "submissions.json");
    let submissions = [];
    
    // Read existing submissions if file exists
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      submissions = JSON.parse(fileContent);
    }
    
    // Add new submission
    submissions.push({ id, timestamp, data });
    
    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
    
    return NextResponse.json({ ok: true, id, data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Invalid JSON" }, { status: 400 });
  }
}
