import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory fallback storage for environments where the filesystem is read-only (e.g., Vercel)
// This is ephemeral and per-instance, but sufficient for demos/tests.
const memStore: Array<{ id: string; timestamp: string; data: any }> = [];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = Math.random().toString(36).slice(2);
    const timestamp = new Date().toISOString();
    
    // Attempt to persist to filesystem, fallback to in-memory if write fails
    const filePath = path.join(process.cwd(), "submissions.json");
    try {
      let submissions: any[] = [];
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

      submissions.push({ id, timestamp, data });
      fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
    } catch {
      // Filesystem not writable; store in memory as a fallback
      memStore.push({ id, timestamp, data });
    }

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
    } else {
      // Fall back to in-memory if file doesn't exist
      submissions = [...memStore];
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
    let usingMemory = false;
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
    } else {
      submissions = [...memStore];
      usingMemory = true;
    }

    if (submissions.length === 0) {
      return NextResponse.json({ ok: false, error: "No submissions to update" }, { status: 404 });
    }

    // Merge into latest submission's data
    const latestIdx = submissions.length - 1;
    const latest = submissions[latestIdx];
    const updated = {
      ...latest,
      data: { ...(latest?.data || {}), ...update },
    };
    submissions[latestIdx] = updated;

    try {
      if (!usingMemory) {
        fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2));
      } else {
        memStore.splice(0, memStore.length, ...submissions);
      }
    } catch {
      // If write fails, update in-memory as a fallback
      memStore.splice(0, memStore.length, ...submissions);
    }
    return NextResponse.json({ ok: true, submission: updated }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed to update" }, { status: 400 });
  }
}
