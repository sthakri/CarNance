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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const latest = url.searchParams.get("latest");

    const filePath = path.join(process.cwd(), "submissions.json");

    if (!fs.existsSync(filePath)) {
      // If no file yet, return empty list
      return NextResponse.json({ ok: true, submissions: [] }, { status: 200 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const submissions: Array<{ id: string; timestamp: string; data: unknown }> = JSON.parse(fileContent);

    if (id) {
      const found = submissions.find((s) => s.id === id);
      if (!found) {
        return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, submission: found }, { status: 200 });
    }

    if (latest) {
      const last = submissions[submissions.length - 1];
      return NextResponse.json({ ok: true, submission: last ?? null }, { status: 200 });
    }

    return NextResponse.json({ ok: true, submissions }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed to read submissions" }, { status: 500 });
  }
}
