export function GET() {
  return Response.json({
    ok: true,
    appEnv: process.env.APP_ENV ?? "unknown",
  });
}
