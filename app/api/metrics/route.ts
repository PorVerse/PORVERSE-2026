// Minimal metrics sink — primește batch-uri de metrice
export async function POST(req: Request) {
  try {
    const data = await req.json();
    // TODO: agregare în DB / Prometheus pushgateway etc.
    console.debug('📈 metrics batch', Array.isArray(data?.metrics) ? data.metrics.length : 0);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'bad payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
