import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'
import { parse, serialize } from 'cookie'
import { getUserFromRequest, getUserCredits, addCredits, incrementUserUsage } from '../../lib/users'

type ModelOption = 'gpt-4o-mini' | 'gpt-4o'
type LengthOption = 'short' | 'standard' | 'detailed'
type Tool = 'cold_email' | 'proposal' | 'contract' | 'social_pack'

const MAX_TOKENS_MAP: Record<LengthOption, number> = {
  short: 500,
  standard: 1000,
  detailed: 2000,
}

interface ColdEmailInputs {
  target: string
  service: string
  tone: string
  language: string
}

interface ProposalInputs {
  clientType: string
  projectScope: string
  deliverables: string
  budgetRange: string
  language: string
}

interface ContractInputs {
  clientName: string
  providerName: string
  serviceDescription: string
  paymentTerms: string
  jurisdiction: string
  language: string
}

interface SocialPackInputs {
  businessType: string
  niche: string
  tone: string
  platform: string
  language: string
}

type Inputs = ColdEmailInputs | ProposalInputs | ContractInputs | SocialPackInputs

interface PremiumOptions {
  model?: ModelOption
  length?: LengthOption
  creativity?: number
  customInstructions?: string
}

interface RequestBody {
  tool: Tool
  inputs: Inputs
  premiumOptions?: PremiumOptions
}

interface ApiResponse {
  ok: boolean
  output?: string
  error?: string
  message?: string
  requiresLogin?: boolean
  freeUsed?: boolean
}

function buildPrompts(tool: Tool, inputs: Inputs): { systemPrompt: string; userPrompt: string } {
  switch (tool) {
    case 'cold_email': {
      const { target, service, tone, language } = inputs as ColdEmailInputs
      return {
        systemPrompt: 'You are an expert B2B sales copywriter.',
        userPrompt: `Write 3 short cold email variants for the following:

Target audience: ${target || 'business owners'}
Service being offered: ${service || 'consulting services'}
Tone: ${tone || 'professional'}
Language: ${language || 'English'}

Each email should include:
- A compelling subject line
- A concise body (3-5 sentences max)

Return as a numbered list (1, 2, 3) with clear separation between each variant.`,
      }
    }

    case 'proposal': {
      const { clientType, projectScope, deliverables, budgetRange, language } = inputs as ProposalInputs
      return {
        systemPrompt: 'You are a professional consultant writing project proposals.',
        userPrompt: `Write a professional project proposal with the following details:

Client Type: ${clientType || 'business client'}
Project Scope: ${projectScope || 'to be defined'}
Deliverables: ${deliverables || 'to be defined'}
Budget Range: ${budgetRange || 'to be discussed'}
Language: ${language || 'English'}

Structure the proposal with these sections:
1. Introduction
2. Understanding of Needs
3. Scope of Work
4. Deliverables
5. Timeline
6. Investment
7. Next Steps

Make it professional, clear, and persuasive.`,
      }
    }

    case 'contract': {
      const { clientName, providerName, serviceDescription, paymentTerms, jurisdiction, language } = inputs as ContractInputs
      return {
        systemPrompt: 'You draft simple, plain-language service agreements (not legal advice).',
        userPrompt: `Draft a simple service agreement with the following details:

Client Name: ${clientName || '[CLIENT NAME]'}
Provider Name: ${providerName || '[PROVIDER NAME]'}
Service Description: ${serviceDescription || 'to be defined'}
Payment Terms: ${paymentTerms || 'to be agreed'}
Jurisdiction: ${jurisdiction || 'to be specified'}
Language: ${language || 'English'}

Include these clauses:
1. Parties
2. Services
3. Term
4. Fees and Payment
5. Confidentiality
6. Intellectual Property
7. Termination
8. Governing Law

Keep it concise and in plain language. Add a disclaimer that this is not legal advice.`,
      }
    }

    case 'social_pack': {
      const { businessType, niche, tone, platform, language } = inputs as SocialPackInputs
      return {
        systemPrompt: 'You are a social media strategist.',
        userPrompt: `Create 10 short social media post ideas for the following:

Business Type: ${businessType || 'business'}
Niche: ${niche || 'general'}
Tone: ${tone || 'friendly'}
Platform: ${platform || 'social media'}
Language: ${language || 'English'}

Provide 10 numbered post ideas (1-10) with captions ready to use.
Each post should be engaging and appropriate for the specified platform.`,
      }
    }

    default:
      throw new Error(`Unknown tool: ${tool}`)
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const replitBaseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  const replitApiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  const standardApiKey = process.env.OPENAI_API_KEY

  const useReplitIntegrations = replitBaseURL && replitApiKey
  const apiKey = useReplitIntegrations ? replitApiKey : standardApiKey
  const baseURL = useReplitIntegrations ? replitBaseURL : undefined

  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'missing_openai_key' })
  }

  const jwtPayload = getUserFromRequest(req.headers.cookie)
  
  const isLoggedIn = !!jwtPayload
  const isAdmin = jwtPayload?.role === 'admin'
  const userId = jwtPayload?.id

  if (!isLoggedIn) {
    const cookies = parse(req.headers.cookie || '')
    const freeUsed = cookies.bizkit_free_used === '1'
    
    if (freeUsed) {
      return res.status(403).json({
        ok: false,
        error: 'Free quota used. Please register or login for unlimited access.',
        requiresLogin: true,
        freeUsed: true,
      })
    }
  }

  const userCredits = isLoggedIn && userId ? await getUserCredits(userId) : 0

  if (isLoggedIn && !isAdmin && userCredits <= 0) {
    return res.status(403).json({
      ok: false,
      error: 'no_credits',
      message: 'You have no credits left. Please buy a pack.',
    })
  }

  try {
    const { tool, inputs, premiumOptions } = req.body as RequestBody

    if (!tool || !inputs) {
      return res.status(400).json({ ok: false, error: 'invalid_request' })
    }

    const model: ModelOption = premiumOptions?.model || 'gpt-4o-mini'
    const length: LengthOption = premiumOptions?.length || 'standard'
    const creativity = premiumOptions?.creativity ?? 50
    const customInstructions = premiumOptions?.customInstructions || ''

    const temperature = Math.min(Math.max(creativity / 100, 0), 1)
    const maxTokens = MAX_TOKENS_MAP[length]

    const { systemPrompt, userPrompt } = buildPrompts(tool, inputs)

    const finalSystemPrompt = customInstructions
      ? `${systemPrompt}\n\nAdditional Instructions from User:\n${customInstructions}`
      : systemPrompt

    const openai = new OpenAI({
      ...(baseURL && { baseURL }),
      apiKey,
    })

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: finalSystemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
    })

    const content = response.choices[0]?.message?.content || ''

    const headers: string[] = []

    if (!isLoggedIn) {
      headers.push(serialize('bizkit_free_used', '1', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      }))
    }

    if (isLoggedIn && userId) {
      await incrementUserUsage(userId)
      
      if (!isAdmin) {
        const success = await addCredits(userId, -1, 'generation')
        if (!success) {
          console.error('Failed to decrement credits for user:', userId)
        }
      }
    }

    if (headers.length > 0) {
      res.setHeader('Set-Cookie', headers)
    }

    return res.status(200).json({
      ok: true,
      output: content,
    })
  } catch (error: any) {
    console.error('OpenAI API Error:', error)

    const errorMessage = error?.message || String(error)
    const errorCode = error?.code || ''

    if (
      errorMessage.includes('429') ||
      errorMessage.includes('insufficient_quota') ||
      errorCode === 'insufficient_quota'
    ) {
      return res.status(200).json({
        ok: true,
        output: 'AI quota is exhausted on the server. Please add credits to the OpenAI account.',
      })
    }

    return res.status(500).json({ ok: false, error: 'openai_error' })
  }
}
