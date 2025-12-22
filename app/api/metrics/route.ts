// Minimal metrics sink — primește batch-uri de metrice
export async function POST(req: Request) {
  try {
    const data = await req.json();
    // TODO: agregare în DB / Prometheus pushgateway etc.
    console.debug('📈 metrics batch', Array.isArray(data?.metrics) ? data.metrics.length : 0);
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'bad payload'
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
