import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isSignedIn } from "@/lib/auth";
import { logCheck, moveCase } from "@/lib/cases";
import { deleteRecord } from "@/lib/store";
import { CHECK_KINDS, STATUS_IDS, type CheckKind, type StatusId } from "@/lib/pipeline";
import { guard, readJson, text } from "@/lib/security";

export const runtime = "nodejs";

/** Founder-only actions from /desk/pipeline: move a case, or log a verification check. */
export async function POST(req: Request) {
  const blocked = guard(req, { key: "desk", limit: 60, maxBytes: 32 * 1024 });
  if (blocked) return blocked;
  if (!(await isSignedIn(req))) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 403 });
  const body = await readJson(req, 32 * 1024);
  if (!body) return NextResponse.json({ ok: false, error: "The request could not be read." }, { status: 400 });

  if (body.action === "status") {
    const id = text(body.id, 64);
    const status = text(body.status, 20) as StatusId;
    if (!STATUS_IDS.includes(status)) return NextResponse.json({ ok: false, error: "Unknown status." }, { status: 400 });
    const c = await moveCase(id, status, text(body.note, 1000).trim() || undefined);
    if (!c) return NextResponse.json({ ok: false, error: "Case not found." }, { status: 404 });
    revalidatePath(`/track/${id}`);
    revalidatePath("/investors");
    revalidatePath("/desk/pipeline");
    return NextResponse.json({ ok: true, case: c });
  }

  if (body.action === "check") {
    const code = text(body.code, 60).trim().toUpperCase();
    const kind = text(body.kind, 20) as CheckKind;
    const date = text(body.date, 10);
    const result = text(body.result, 10);
    const lines = text(body.lines, 6000)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 40);
    if (!/^TM-[A-Z]{3}(-[A-Z0-9]+)+$/.test(code)) return NextResponse.json({ ok: false, error: "Enter a TM code." }, { status: 400 });
    if (!CHECK_KINDS.some((k) => k.id === kind)) return NextResponse.json({ ok: false, error: "Choose what was checked." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ ok: false, error: "Give the date of the check." }, { status: 400 });
    if (!["pass", "fail", "info"].includes(result)) return NextResponse.json({ ok: false, error: "Choose a result." }, { status: 400 });
    if (!lines.length) return NextResponse.json({ ok: false, error: "Add at least one measurement or finding." }, { status: 400 });
    const supplier = text(body.supplier, 20).trim().toUpperCase();
    const batch = text(body.batch, 40).trim();
    const units = Number(body.units);
    const check = await logCheck({
      code,
      kind,
      date,
      result: result as "pass" | "fail" | "info",
      lines,
      by: text(body.by, 8).trim().toUpperCase() || "TM",
      ...(supplier ? { supplier } : {}),
      ...(batch ? { batch } : {}),
      ...(Number.isFinite(units) && units > 0 ? { units: Math.round(units) } : {}),
      ...(text(body.notes, 1000).trim() ? { notes: text(body.notes, 1000).trim() } : {}),
    });
    revalidatePath("/evidence");
    revalidatePath("/investors");
    revalidatePath("/desk/pipeline");
    return NextResponse.json({ ok: true, check });
  }

  if (body.action === "delete") {
    const id = text(body.id, 64);
    const what = body.what === "check" ? "checks" : "cases";
    if (what === "cases" ? !/^[a-f0-9]{32}$/.test(id) : !/^\d{8}-[a-f0-9]{8}$/.test(id)) return NextResponse.json({ ok: false, error: "Bad id." }, { status: 400 });
    await deleteRecord(`${what}/${id}.json`);
    for (const p of ["/evidence", "/investors", "/desk/pipeline", `/track/${id}`]) revalidatePath(p);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}
