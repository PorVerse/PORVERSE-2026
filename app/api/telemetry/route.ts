// Minimal telemetry sink — acceptă evenimentele clientului și răspunde 204
export async function POST(req: Request) {
  try {
    const data = await req.json();
    // TODO: scrie în DB / Sentry dacă vrei
    console.debug('📥 telemetry event', data?.events?.[0]?.type ?? 'batch', data);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'bad payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
