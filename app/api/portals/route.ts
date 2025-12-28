/**
 * GET /api/portals
 * Lista toate portalurile disponibile
 * MEGA INTERSTELLAR Portal System API
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const includeSteps = searchParams.get('includeSteps') === 'true'

    // Fetch portals
    let query = supabase
      .from('portals')
      .select(includeSteps ? '*, steps:portal_steps(*)' : '*')
      .order('difficulty', { ascending: true })

    const { data: portals, error } = await query

    if (error) {
      console.error('Error fetching portals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch portals', details: error.message },
        { status: 500 }
      )
    }

    // Get user progress if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userProgress: any[] = []
    if (user) {
      const { data: progressData } = await supabase
        .from('user_portal_progress')
        .select('*')
        .eq('user_id', user.id)

      userProgress = progressData || []
    }

    // Enrich portals with user progress
    const enrichedPortals = portals?.map((portal) => {
      const progress = userProgress.find((p) => p.portal_id === portal.id)
      return {
        ...portal,
        userProgress: progress || null,
        isStarted: !!progress,
        isCompleted: !!progress?.completed_at,
        progressPercent: progress
          ? Math.round((progress.completed_steps.length / portal.steps?.length || 1) * 100)
          : 0,
      }
    })

    return NextResponse.json(
      {
        data: enrichedPortals,
        count: enrichedPortals?.length || 0,
        cached: false,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error: any) {
    console.error('Unexpected error in /api/portals:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      Sentry.captureMessage('Circuit breaker opened for database', {
        level: 'error',
        extra: { failureCount: this.failureCount },
      });
    }
  }
}

const dbCircuitBreaker = new CircuitBreaker();

/**
 * Generate cache key for portals
 */
function getCacheKey(filters: Record<string, unknown>): string {
  const sorted = Object.keys(filters)
    .sort()
    .reduce((acc, key) => ({ ...acc, [key]: filters[key] }), {});
  return `portals:${JSON.stringify(sorted)}`;
}

/**
 * Structured logger
 */
function log(level: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/portals - Query portals
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const span = tracer.startSpan('portals.get');
  const requestId = crypto.randomUUID();

  try {
    // ─────────── Rate Limiting ───────────
    const ip = request.ip ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
      'X-Request-ID': requestId,
    };

    if (!success) {
      log('warn', 'Rate limit exceeded', { ip, requestId });
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Rate limit exceeded' });
      span.end();
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers }
      );
    }

    // ─────────── Parse & Validate Query Params ───────────
    const searchParams = request.nextUrl.searchParams;
    const filters = PortalFilterSchema.parse({
      category: searchParams.get('category'),
      difficulty: searchParams.get('difficulty'),
      isLocked: searchParams.get('isLocked'),
      includeSteps: searchParams.get('includeSteps'),
    });

    log('info', 'GET /api/portals', { filters, requestId });

    // ─────────── Check Cache (Layer 1: Redis) ───────────
    const cacheKey = getCacheKey(filters);
    const cached = await redis.get(cacheKey);

    if (cached) {
      log('info', 'Cache HIT', { cacheKey, requestId });
      span.setAttribute('cache', 'hit');
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return NextResponse.json(
        { data: cached, cached: true },
        { headers: { ...headers, 'X-Cache': 'HIT' } }
      );
    }

    log('info', 'Cache MISS', { cacheKey, requestId });
    span.setAttribute('cache', 'miss');

    // ─────────── Database Query (with Circuit Breaker) ───────────
    const data = await dbCircuitBreaker.execute(async () => {
      let query = supabase.from('portals').select(
        filters.includeSteps
          ? `
              *,
              steps (
                id,
                order_number,
                title,
                description,
                prompt,
                type
              )
            `
          : '*'
      );

      // Apply filters (only if they exist)
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.difficulty) {
        query = query.eq('difficulty', filters.difficulty);
      }
      if (filters.isLocked !== undefined && filters.isLocked !== null) {
        query = query.eq('is_locked', filters.isLocked);
      }

      // Order by category and difficulty
      query = query.order('category').order('difficulty');

      const { data, error } = await query;

      if (error) {
        Sentry.captureException(error, {
          tags: { api_route: 'portals', method: 'GET' },
          extra: { filters, requestId },
        });
        throw error;
      }

      return data;
    });

    // ─────────── Cache Result (TTL: 5 minutes) ───────────
    await redis.setex(cacheKey, 300, JSON.stringify(data));

    log('info', 'Portals fetched successfully', {
      count: data.length,
      requestId,
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    return NextResponse.json(
      { data, cached: false },
      { headers: { ...headers, 'X-Cache': 'MISS' } }
    );
  } catch (error) {
    log('error', 'Error fetching portals', {
      error: (error as Error).message,
      requestId,
    });

    Sentry.captureException(error, {
      tags: { api_route: 'portals', method: 'GET' },
      extra: { requestId },
    });

    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: (error as Error).message,
        requestId,
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/portals - Create new portal (admin only)
// ═══════════════════════════════════════════════════════════════════════════

const CreatePortalSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(['awakening', 'transformation', 'mastery', 'transcendence']),
  difficulty: z.number().int().min(1).max(5),
  estimated_time: z.number().positive(),
  experience_points: z.number().nonnegative().default(0),
  is_locked: z.boolean().default(false),
  unlock_requirement: z.object({
    required_level: z.number().int().positive(),
    required_portals: z.array(z.string().uuid()).default([]),
  }),
});

export async function POST(request: NextRequest) {
  const span = tracer.startSpan('portals.create');
  const requestId = crypto.randomUUID();

  try {
    // ─────────── Rate Limiting ───────────
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // ─────────── Authentication Check ───────────
    // TODO: Implement actual auth check
    // const session = await getSession(request);
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // ─────────── Parse & Validate Body ───────────
    const body = await request.json();
    const validatedData = CreatePortalSchema.parse(body);

    log('info', 'POST /api/portals', { data: validatedData, requestId });

    // ─────────── Create Portal ───────────
    const { data, error } = await dbCircuitBreaker.execute(async () => {
      return await supabase
        .from('portals')
        .insert([validatedData])
        .select()
        .single();
    });

    if (error) {
      Sentry.captureException(error);
      throw error;
    }

    // ─────────── Invalidate Cache ───────────
    // Delete all cache keys that match portals:*
    const keys = await redis.keys('portals:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    log('info', 'Portal created successfully', { portalId: data.id, requestId });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    return NextResponse.json(
      { data, message: 'Portal created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      log('warn', 'Validation error', { errors: error.errors, requestId });
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.end();
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    log('error', 'Error creating portal', {
      error: (error as Error).message,
      requestId,
    });

    Sentry.captureException(error);
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();

    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}