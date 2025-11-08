// app/api/ai/chat/route.ts
// AI Chat API - Cu context personalizat din răspunsurile utilizatorului

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// Helper pentru a construi system prompt cu context
function buildSystemPrompt(portalTitle: string, portalDescription: string, userContext: any) {
  const { user, journey, portals, responses, stats } = userContext

  let prompt = `You are a compassionate, insightful spiritual AI guide helping ${user.name || 'a user'} through the "${portalTitle}" portal.

Portal Description: ${portalDescription}

YOUR ROLE:
- Provide empathetic, personalized guidance based on their journey
- Offer practical insights and transformative exercises
- Support emotional wellbeing and personal growth
- Be warm, understanding, and non-judgmental
- Reference their previous answers to show you remember and understand them

USER CONTEXT:
`

  // Journey overview
  prompt += `\nJOURNEY PROGRESS:
- Overall Progress: ${journey.overallProgress}%
- Portals Started: ${journey.startedPortals} / ${journey.totalPortals}
- Portals Completed: ${journey.completedPortals}
- Total Responses Given: ${stats.totalResponses}
- Total Words Written: ${stats.totalWordsWritten}
`

  // Portal-specific progress
  if (portals && portals.length > 0) {
    prompt += `\nPORTAL PROGRESS:\n`
    portals.forEach((p: any) => {
      prompt += `- ${p.title}: Step ${p.currentStep}/${p.totalSteps} (${p.completion}% complete) - ${p.status}\n`
    })
  }

  // User's previous responses (KEY CONTEXT!)
  if (responses && responses.length > 0) {
    prompt += `\nUSER'S PREVIOUS ANSWERS (use this to personalize guidance):\n`
    
    // Group by portal
    const responsesByPortal = responses.reduce((acc: any, r: any) => {
      if (!acc[r.portalCode]) acc[r.portalCode] = []
      acc[r.portalCode].push(r)
      return acc
    }, {})

    Object.entries(responsesByPortal).forEach(([_, resps]: [string, any]) => {
      prompt += `\n${resps[0].portal}:\n`
      resps.forEach((r: any) => {
        prompt += `  Step ${r.step} - ${r.stepTitle}:\n`
        Object.entries(r.answers).forEach(([_, value]: [string, any]) => {
          if (value && value.trim()) {
            prompt += `    • ${value.substring(0, 200)}${value.length > 200 ? '...' : ''}\n`
          }
        })
      })
    })
  }

  prompt += `\nGUIDANCE STYLE:
- Keep responses concise (2-3 paragraphs) and actionable
- Reference their specific answers when relevant
- Provide practical next steps or exercises
- Ask thoughtful follow-up questions
- Celebrate their progress and insights
- Be encouraging but realistic`

  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const { userId, portalId, message, context } = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile pentru subscription check
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    const canUseAI = profile?.subscription_tier !== 'free'

    if (!canUseAI) {
      return NextResponse.json(
        { error: 'AI features require Pro or Elite subscription' },
        { status: 403 }
      )
    }

    // Get portal info
    const { data: portal } = await supabase
      .from('portals')
      .select('*')
      .eq('id', portalId)
      .single()

    // GET USER CONTEXT - toate răspunsurile lor!
    const contextResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/get-user-context?userId=${userId}&portalId=${portalId}`,
      {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      }
    )

    let userContext = null
    if (contextResponse.ok) {
      const data = await contextResponse.json()
      userContext = data.context
    }

    // Create sau get conversation
    let { data: conversation } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('portal_id', portalId)
      .eq('conversation_type', 'guidance')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          portal_id: portalId,
          title: `${portal?.title || 'Portal'} Guidance`,
          ai_provider: profile?.subscription_tier === 'elite' ? 'anthropic' : 'openai',
          model: profile?.subscription_tier === 'elite' ? 'claude-3-5-sonnet-20241022' : 'gpt-4',
          conversation_type: 'guidance',
        })
        .select()
        .single()

      conversation = newConversation
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversation!.id)
      .order('created_at', { ascending: true })
      .limit(10)

    // Build system prompt cu USER CONTEXT
    const systemPrompt = buildSystemPrompt(
      portal?.title || context,
      portal?.description || '',
      userContext || {}
    )

    // Build messages array
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt,
      },
      ...(history || []).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: message,
      },
    ]

    // Call AI
    let aiResponse: string

    if (profile?.subscription_tier === 'elite') {
      // Use Claude pentru Elite users
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: messages.slice(1) as any,
        system: messages[0].content,
      })

      aiResponse =
        response.content[0].type === 'text' ? response.content[0].text : ''
    } else {
      // Use GPT-4 pentru Pro users
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      })

      aiResponse = response.choices[0]?.message?.content || 'No response'
    }

    // Save messages
    await supabase.from('ai_messages').insert([
      {
        conversation_id: conversation!.id,
        role: 'user',
        content: message,
      },
      {
        conversation_id: conversation!.id,
        role: 'assistant',
        content: aiResponse,
      },
    ])

    return NextResponse.json({
      message: aiResponse,
      conversationId: conversation!.id,
      hasContext: !!userContext,
      contextStats: userContext?.stats || null,
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request' },
      { status: 500 }
    )
  }
}