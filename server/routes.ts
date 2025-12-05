import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// For this application, we use gpt-4o-mini as specified in requirements
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GenerateRequest {
  tool: "cold_email" | "proposal" | "contract" | "social_pack";
  inputs: Record<string, string>;
}

function buildPrompts(tool: string, inputs: Record<string, string>): { systemPrompt: string; userPrompt: string } {
  switch (tool) {
    case "cold_email":
      return {
        systemPrompt: "You are an expert B2B sales copywriter.",
        userPrompt: `Write 3 short cold email variants for the following:
- Target audience: ${inputs.target || "not specified"}
- Service offered: ${inputs.service || "not specified"}
- Tone: ${inputs.tone || "professional"}
- Language: ${inputs.language || "English"}

Each email should have a subject line and body. Return as a numbered list (1, 2, 3).`
      };

    case "proposal":
      return {
        systemPrompt: "You are a professional consultant writing project proposals.",
        userPrompt: `Write a professional project proposal with the following details:
- Client type: ${inputs.clientType || "not specified"}
- Project scope: ${inputs.projectScope || "not specified"}
- Deliverables: ${inputs.deliverables || "not specified"}
- Budget range: ${inputs.budgetRange || "not specified"}
- Language: ${inputs.language || "English"}

Include the following sections:
1. Introduction
2. Understanding of Needs
3. Scope of Work
4. Deliverables
5. Timeline
6. Investment
7. Next Steps`
      };

    case "contract":
      return {
        systemPrompt: "You draft simple, plain-language service agreements (not legal advice).",
        userPrompt: `Draft a concise service agreement with the following details:
- Client name: ${inputs.clientName || "[CLIENT NAME]"}
- Provider name: ${inputs.providerName || "[PROVIDER NAME]"}
- Service description: ${inputs.serviceDescription || "not specified"}
- Payment terms: ${inputs.paymentTerms || "not specified"}
- Jurisdiction: ${inputs.jurisdiction || "not specified"}
- Language: ${inputs.language || "English"}

Include the following clauses:
1. Parties
2. Services
3. Term
4. Fees and Payment
5. Confidentiality
6. Intellectual Property
7. Termination
8. Governing Law

Note: This is a template and not legal advice. Parties should consult with legal professionals.`
      };

    case "social_pack":
      return {
        systemPrompt: "You are a social media strategist.",
        userPrompt: `Create 10 short social media post ideas with captions for the following:
- Business type: ${inputs.businessType || "not specified"}
- Niche: ${inputs.niche || "not specified"}
- Tone: ${inputs.tone || "friendly"}
- Platform: ${inputs.platform || "Instagram"}
- Language: ${inputs.language || "English"}

Number them 1-10. Each post should include a caption ready to copy and paste.`
      };

    default:
      throw new Error("Invalid tool");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/generate", async (req, res) => {
    try {
      const { tool, inputs } = req.body as GenerateRequest;

      if (!tool || !inputs) {
        return res.status(400).json({ ok: false, error: "Missing tool or inputs" });
      }

      if (!["cold_email", "proposal", "contract", "social_pack"].includes(tool)) {
        return res.status(400).json({ ok: false, error: "Invalid tool" });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ ok: false, error: "missing_openai_key" });
      }

      const { systemPrompt, userPrompt } = buildPrompts(tool, inputs);

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;

        if (!content) {
          return res.status(500).json({ ok: false, error: "No response from AI" });
        }

        return res.json({ ok: true, output: content });

      } catch (openaiError: any) {
        console.error("OpenAI API error:", openaiError);

        if (openaiError?.status === 429 || openaiError?.code === "insufficient_quota") {
          return res.json({ 
            ok: true, 
            output: "AI quota is exhausted on the server. Please add credits to the OpenAI account." 
          });
        }

        return res.status(500).json({ ok: false, error: "openai_error" });
      }

    } catch (error) {
      console.error("Generate API error:", error);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  });

  return httpServer;
}
