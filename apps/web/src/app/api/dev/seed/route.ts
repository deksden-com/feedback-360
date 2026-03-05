import { runSeedScenario } from "@feedback-360/db";
import { NextResponse } from "next/server";

const isDevLike = process.env.APP_ENV !== "prod";

export async function POST(request: Request) {
  if (!isDevLike) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = (await request.json()) as { scenario?: unknown };
  if (typeof payload.scenario !== "string" || payload.scenario.trim().length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "scenario is required.",
      },
      { status: 400 },
    );
  }

  const seeded = await runSeedScenario({
    scenario: payload.scenario as Parameters<typeof runSeedScenario>[0]["scenario"],
  });

  return NextResponse.json({
    ok: true,
    scenario: seeded.scenario,
    handles: seeded.handles,
  });
}
