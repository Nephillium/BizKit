export const GENERATION_TOOLS = ['cold_email', 'proposal', 'contract', 'social_pack'] as const;

export type GenerationTool = (typeof GENERATION_TOOLS)[number];
export type DemoLength = 'short' | 'standard' | 'detailed';

export function isGenerationTool(value: string): value is GenerationTool {
  return (GENERATION_TOOLS as readonly string[]).includes(value);
}

function text(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function footer(length: DemoLength, creativity: number, custom: string): string {
  const note = custom ? `\n\nYour extra instructions: ${custom}` : '';
  return `${note}\n\n---\nDemo mode — sample output, not a live model. Length setting: ${length}. Creativity: ${creativity}%. Set HUGGINGFACE_API_KEY or LMSTUDIO_API_URL, and leave DEMO_MODE unset, to call a real provider.`;
}

function coldEmail(inputs: Record<string, unknown>, length: DemoLength): string {
  const target = text(inputs.target, 'independent consultants');
  const service = text(inputs.service, 'a focused client-acquisition offer');
  const tone = text(inputs.tone, 'professional');
  const language = text(inputs.language, 'English');
  const variants = [
    `1. Subject: A ${tone} note for ${target}\n\nHello,\n\nI work with ${target} on ${service}. The usual pattern is a full pipeline and very little time to write the first email, so I drafted one they can send this week.\n\nWould it be useful if I sent a 5-line version aimed at one of your current prospects?\n\nBest,\nAlex Morgan`,
    `2. Subject: ${service} for ${target}\n\nHi,\n\nMost ${target} I speak with already know the offer. What stalls the deal is the first message. I help them ship ${service} in a ${tone} voice, in ${language}, without a week of rewriting.\n\nIf you want, I can rewrite one live email and you can judge it before any call.\n\nThanks,\nAlex Morgan`,
    `3. Subject: Worth a look this week?\n\nHello,\n\nI put together a short sequence for ${target} selling ${service}. It stays ${tone}, names the outcome in the first two lines, and asks for a reply rather than a meeting.\n\nReply "sample" and I will send the sequence in ${language}.\n\nAlex Morgan`,
  ];
  const count = length === 'short' ? 1 : length === 'detailed' ? 3 : 2;
  const extra = length === 'detailed'
    ? `\n\nFollow-up (day 4)\nSubject: Re: ${service}\n\nHi — circling back once. If ${service} is not a priority for ${target} this month, I will close the loop. If it is, tell me which prospect to rewrite first.`
    : '';
  return `Language: ${language}\nTone: ${tone}\n\n${variants.slice(0, count).join('\n\n')}${extra}`;
}

function proposal(inputs: Record<string, unknown>, length: DemoLength): string {
  const clientType = text(inputs.clientType, 'a growing services business');
  const projectScope = text(inputs.projectScope, 'a four-week engagement to clarify the offer and the outreach');
  const deliverables = text(inputs.deliverables, 'a messaging brief, three outreach sequences, and a proposal template');
  const budgetRange = text(inputs.budgetRange, 'to be confirmed');
  const language = text(inputs.language, 'English');
  const timeline = length === 'short'
    ? 'Week 1 discovery, week 2 draft, week 3 revision.'
    : 'Week 1: discovery and source material. Week 2: first draft. Week 3: revisions. Week 4: handoff and a 45-minute walkthrough.';
  const extra = length === 'detailed'
    ? `\n\n8. Assumptions\nThe client provides access to one past proposal, one won deal, and a single point of contact who can approve copy within three business days. Work outside ${projectScope} is quoted separately.\n\n9. Why this approach\n${clientType} usually loses deals in the gap between a good conversation and a document the buyer can forward. This engagement closes that gap.`
    : '';
  return `Project proposal (${language})

1. Introduction
This proposal is for ${clientType}. The engagement covers ${projectScope}.

2. Understanding of needs
Buyers need a document they can forward internally. The current gap is not more strategy. It is a clear offer, a defined scope, and language that sounds like the firm.

3. Scope of work
${projectScope}

4. Deliverables
${deliverables}

5. Timeline
${timeline}

6. Investment
${budgetRange}. One revision round is included. Additional rounds are billed at the agreed hourly rate.

7. Next steps
Confirm the scope, share the source material, and book the kickoff. Work starts on the following Monday.${extra}`;
}

function contract(inputs: Record<string, unknown>, length: DemoLength): string {
  const clientName = text(inputs.clientName, '[Client name]');
  const providerName = text(inputs.providerName, '[Provider name]');
  const serviceDescription = text(inputs.serviceDescription, 'content and outreach drafting described in the statement of work');
  const paymentTerms = text(inputs.paymentTerms, '50% on signature and 50% on delivery');
  const jurisdiction = text(inputs.jurisdiction, 'the jurisdiction named by the parties');
  const language = text(inputs.language, 'English');
  const confidentiality = length === 'short'
    ? 'Each party keeps the other party\'s non-public information private during the work and for two years after.'
    : 'Each party keeps the other party\'s non-public information private during the work and for two years after. Information that is already public, independently developed, or required by law is excluded. On request, each party returns or deletes the other party\'s materials.';
  const extra = length === 'detailed'
    ? `\n\n9. Changes\nChanges to the services are confirmed in writing, including the effect on fees and dates.\n\n10. Liability\nEach party's total liability under this agreement is limited to the fees paid under it, except for unpaid fees, confidentiality breaches, or liability that cannot be limited by law.`
    : '';
  return `Service agreement (${language})

This is a plain-language draft for discussion. It is not legal advice and it is not a substitute for review by a qualified lawyer.

1. Parties
Client: ${clientName}
Provider: ${providerName}

2. Services
The provider will perform ${serviceDescription}. Work outside that description needs a written change.

3. Term
The agreement starts when both parties sign and ends when the services are delivered and paid, unless ended earlier under Termination.

4. Fees and payment
${paymentTerms}. Invoices are due within 14 days. Late amounts may pause the work.

5. Confidentiality
${confidentiality}

6. Intellectual property
On receipt of payment, the client owns the final deliverables. The provider keeps its pre-existing methods, templates, and tools, and may reuse general know-how that does not reveal the client's confidential information.

7. Termination
Either party may end the agreement with 7 days' written notice. The client pays for work completed through the end date.

8. Governing law
This agreement is governed by the laws of ${jurisdiction}.${extra}

Disclaimer: Demo sample for layout and discussion only. Have counsel review any agreement before use.`;
}

function socialPack(inputs: Record<string, unknown>, length: DemoLength): string {
  const businessType = text(inputs.businessType, 'a freelance studio');
  const niche = text(inputs.niche, 'client acquisition');
  const tone = text(inputs.tone, 'clear');
  const platform = text(inputs.platform, 'LinkedIn');
  const language = text(inputs.language, 'English');
  const count = length === 'short' ? 4 : length === 'detailed' ? 10 : 7;
  const ideas = [
    `The first message ${businessType} should stop sending in ${niche}.`,
    `A before/after: a vague offer versus one sentence a buyer can repeat.`,
    `Three questions to ask before writing a proposal for ${niche}.`,
    `What ${platform} readers in ${niche} actually reply to.`,
    `A 4-line post on pricing ${businessType} services without apologizing.`,
    `Myth: more content will fix a fuzzy offer. Reality check for ${niche}.`,
    `One story from a sales call, told in a ${tone} voice, with the lesson in the last line.`,
    `A checklist: send this before you attach a proposal.`,
    `How to ask for the next step without a "just checking in" note.`,
    `A week of ${platform} posts that all point at the same ${niche} offer.`,
  ];
  const posts = ideas.slice(0, count).map((idea, index) => {
    return `${index + 1}. ${idea}\nCaption: ${businessType} working in ${niche} can use this on ${platform}. Keep the voice ${tone}. Write it in ${language}. End with one question.`;
  });
  return `Social pack for ${businessType}\nNiche: ${niche}\nPlatform: ${platform}\nTone: ${tone}\nLanguage: ${language}\n\n${posts.join('\n\n')}`;
}

export function buildDemoOutput(
  tool: GenerationTool,
  inputs: Record<string, unknown>,
  options?: { length?: string; creativity?: number; customInstructions?: string }
): string {
  const length: DemoLength = options?.length === 'short' || options?.length === 'detailed'
    ? options.length
    : 'standard';
  const creativity = Number.isFinite(options?.creativity)
    ? Math.min(100, Math.max(0, Math.round(Number(options?.creativity))))
    : 50;
  const custom = text(options?.customInstructions, '');
  const body = tool === 'cold_email'
    ? coldEmail(inputs, length)
    : tool === 'proposal'
      ? proposal(inputs, length)
      : tool === 'contract'
        ? contract(inputs, length)
        : socialPack(inputs, length);
  return `${body}${footer(length, creativity, custom)}`;
}
