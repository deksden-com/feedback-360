import { runSeedScenario } from "@feedback-360/db";
import { NextResponse } from "next/server";

const isDevLike = process.env.APP_ENV !== "prod";
let seedQueue: Promise<unknown> = Promise.resolve();

const enqueueSeed = async <T>(task: () => Promise<T>): Promise<T> => {
  const run = seedQueue.then(task, task);
  seedQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

export async function POST(request: Request) {
  if (!isDevLike) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = (await request.json()) as { scenario?: unknown; variant?: unknown };
  if (typeof payload.scenario !== "string" || payload.scenario.trim().length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "scenario is required.",
      },
      { status: 400 },
    );
  }

  const variant =
    typeof payload.variant === "string" && payload.variant.trim().length > 0
      ? payload.variant.trim()
      : undefined;

  try {
    const seeded = await enqueueSeed(async () => {
      return runSeedScenario({
        scenario: payload.scenario as Parameters<typeof runSeedScenario>[0]["scenario"],
        ...(variant ? { variant } : {}),
      });
    });

    return NextResponse.json({
      ok: true,
      scenario: seeded.scenario,
      ...(seeded.variant ? { variant: seeded.variant } : {}),
      handles: seeded.handles,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected seed error.";
    const status = message.includes("holds the beta lock") ? 409 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}
