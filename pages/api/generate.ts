import type { NextApiRequest, NextApiResponse } from 'next'
import { parse, serialize } from 'cookie'
import { getUserFromRequest, getUserCredits, addCredits, incrementUserUsage } from '../../lib/users'

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

function buildPrompt(tool: Tool, inputs: Inputs): string {
  switch (tool) {
    case 'cold_email': {
      const { target, service, tone, language } = inputs as ColdEmailInputs
      return `You are an expert B2B sales copywriter.

Write 3 short cold email variants for the following:

Target audience: ${target || 'business owners'}
Service being offered: ${service || 'consulting services'}
Tone: ${tone || 'professional'}
Language: ${language || 'English'}

Each email should include:
- A compelling subject line
- A concise body (3-5 sentences max)

Return as a numbered list (1, 2, 3) with clear separation between each variant.`
    }

    case 'proposal': {
      const { clientType, projectScope, deliverables, budgetRange, language } = inputs as ProposalInputs
      return `You are a professional consultant writing project proposals.

Write a professional project proposal with the following details:

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

Make it professional, clear, and persuasive.`
    }

    case 'contract': {
      const { clientName, providerName, serviceDescription, paymentTerms, jurisdiction, language } = inputs as ContractInputs
      return `You draft simple, plain-language service agreements (not legal advice).

Draft a simple service agreement with the following details:

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

Keep it concise and in plain language. Add a disclaimer that this is not legal advice.`
    }

    case 'social_pack': {
      const { businessType, niche, tone, platform, language } = inputs as SocialPackInputs
      return `You are a social media strategist.

Create 10 short social media post ideas for the following:

Business Type: ${businessType || 'business'}
Niche: ${niche || 'general'}
Tone: ${tone || 'friendly'}
Platform: ${platform || 'social media'}
Language: ${language || 'English'}

Provide 10 numbered post ideas (1-10) with captions ready to use.
Each post should be engaging and appropriate for the specified platform.`
    }

    default:
      throw new Error(`Unknown tool: ${tool}`)
  }
}

async function callHuggingFace(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY
  
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY not configured')
  }

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          return_full_text: false,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Hugging Face API error:', errorText)
    throw new Error(`Hugging Face API error: ${response.status}`)
  }

  const result = await response.json()
  
  if (Array.isArray(result) && result[0]?.generated_text) {
    return result[0].generated_text
  }
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  return JSON.stringify(result)
}

async function callLMStudio(prompt: string, maxTokens: number, temperature: number): Promise<string> {
  const baseUrl = process.env.LMSTUDIO_API_URL || 'http://localhost:1234/v1'
  const model = process.env.LMSTUDIO_MODEL || 'local-model'

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer lm-studio',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('LM Studio API error:', errorText)
    throw new Error(`LM Studio API error: ${response.status}`)
  }

  const result = await response.json()
  
  if (result.choices?.[0]?.message?.content) {
    return result.choices[0].message.content
  }
  
  throw new Error('Invalid LM Studio response')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  const useLMStudio = !!process.env.LMSTUDIO_API_URL
  const huggingFaceKey = process.env.HUGGINGFACE_API_KEY

  if (!useLMStudio && !huggingFaceKey) {
    return res.status(500).json({ ok: false, error: 'missing_api_key' })
  }

  const jwtPayload = getUserFromRequest(req.headers.cookie, req.headers.authorization)
  
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

    const length: LengthOption = premiumOptions?.length || 'standard'
    const creativity = premiumOptions?.creativity ?? 50
    const customInstructions = premiumOptions?.customInstructions || ''

    const temperature = Math.min(Math.max(creativity / 100, 0), 1)
    const maxTokens = MAX_TOKENS_MAP[length]

    let prompt = buildPrompt(tool, inputs)

    if (customInstructions) {
      prompt = `${prompt}\n\nAdditional Instructions: ${customInstructions}`
    }

    let content: string

    if (useLMStudio) {
      content = await callLMStudio(prompt, maxTokens, temperature)
    } else {
      content = await callHuggingFace(prompt, maxTokens, temperature)
    }

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
    console.error('API Error:', error)

    const errorMessage = error?.message || String(error)

    if (errorMessage.includes('loading')) {
      return res.status(200).json({
        ok: true,
        output: 'The AI model is loading. Please try again in a few seconds.',
      })
    }

    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return res.status(500).json({ 
        ok: false, 
        error: 'Cannot connect to LM Studio. Make sure it is running and accessible.' 
      })
    }

    return res.status(500).json({ ok: false, error: 'generation_error' })
  }
}
