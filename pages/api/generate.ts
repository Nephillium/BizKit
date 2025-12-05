import type { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own OpenAI API key. Charges are billed to your Replit credits.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const MODEL = 'gpt-4o-mini' // Using gpt-4o-mini as specified in user requirements

type Tool = 'cold_email' | 'proposal' | 'contract' | 'social_pack'

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

interface RequestBody {
  tool: Tool
  inputs: Inputs
}

interface ApiResponse {
  ok: boolean
  output?: string
  error?: string
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

  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY

  if (!baseURL || !apiKey) {
    return res.status(500).json({ ok: false, error: 'missing_openai_key' })
  }

  try {
    const { tool, inputs } = req.body as RequestBody

    if (!tool || !inputs) {
      return res.status(400).json({ ok: false, error: 'invalid_request' })
    }

    const { systemPrompt, userPrompt } = buildPrompts(tool, inputs)

    const openai = new OpenAI({
      baseURL,
      apiKey,
    })

    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    })

    const content = response.choices[0]?.message?.content || ''

    return res.status(200).json({ ok: true, output: content })
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
