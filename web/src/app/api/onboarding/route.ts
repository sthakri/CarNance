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
    let submissions: any[] = [];
    
    // Read existing submissions if file exists
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        if (fileContent && fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);
          submissions = Array.isArray(parsed) ? parsed : [];
        }
      } catch {
        // If file is empty or corrupted, reset to empty array
        submissions = [];
      }
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
    let submissions: Array<{ id: string; timestamp: string; data: unknown }> = [];
    try {
      if (fileContent && fileContent.trim().length > 0) {
        const parsed = JSON.parse(fileContent);
        submissions = Array.isArray(parsed) ? parsed : [];
      }
    } catch {
      submissions = [];
    }

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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const update = (body?.data ?? {}) as Record<string, unknown>;
    const filePath = path.join(process.cwd(), "submissions.json");

    let submissions: Array<{ id: string; timestamp: string; data: any }> = [];
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        if (fileContent && fileContent.trim().length > 0) {
          const parsed = JSON.parse(fileContent);
          submissions = Array.isArray(parsed) ? parsed : [];
        }
      } catch {
        submissions = [];
      }
    }

    if (submissions.length === 0) {
      return NextResponse.json({ ok: false, error: "No submissions to update" }, { status: 404 });
    }

    // Merge into latest submission's data
    const latestIdx = submissions.length - 1;
    const latest = submissions[latestIdx];
    submissions[latestIdx] = {
      ...latest,
      data: { ...(latest?.data || {}), ...update },
    };

    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
    return NextResponse.json({ ok: true, submission: submissions[latestIdx] }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed to update" }, { status: 400 });
  }
}
