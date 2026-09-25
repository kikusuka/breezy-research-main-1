/**
 * Structured Evidence Graph & Summarizer
 * Runtime-agnostic evidence graph extraction
 * Strict Truthfulness: No fabricated metrics or artificial consensus clamping.
 */

import { callAgentWithStream } from './providers';
import { BackendEnv } from './types';

export async function summarizeStage(content: string, roleName: string, apiKey?: string, env: BackendEnv = {}): Promise<string> {
  if (!content || content.length < 300) return content;
  try {
    const summaryPrompt = `You are a high-density technical outline compressor.
Your sole job is to compress the "${roleName}" output into a high-density, ultra-compact technical summary.
- Extract only the key technical decisions, designs, identified bugs, or critical objections.
- Do NOT use explanatory narrative, conversational introduction, or polite conclusions.
- Output ONLY a flat, highly compressed list of technical bullets.
- Restrict your output to a maximum of 150 words.

CONTENT TO COMPRESS:
${content}`;

    const summary = await callAgentWithStream({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      apiKey: apiKey || env.GEMINI_API_KEY,
      systemInstruction: 'You are a high-density technical outline generator.',
      userPrompt: summaryPrompt,
      temperature: 0.1,
      enableSearchGrounding: false,
      onChunk: () => {},
      env,
    });
    return summary ? summary.trim() : content;
  } catch (err) {
    console.warn(`Failed to condense ${roleName} turn, using raw content:`, err);
    return content;
  }
}

export async function generateRealEvidenceGraph(opts: {
  prompt: string;
  finalSynthesis: string;
  proposalContent: string;
  critiqueContent: string;
  discoveredSources: any[];
  durationMs: number;
  isSolo?: boolean;
  apiKey?: string;
  env?: BackendEnv;
}): Promise<{ evidenceGraph: any; researchMetrics: any }> {
  const { prompt, finalSynthesis, proposalContent, critiqueContent, discoveredSources, durationMs, isSolo = false, apiKey, env = {} } = opts;

  // In solo mode, there is no multi-agent debate consensus rate
  if (isSolo) {
    return {
      evidenceGraph: {
        researchPlan: [`Single-model inquiry: ${prompt.slice(0, 80)}`],
        claims: [],
        contradictions: [],
        sourcesConsulted: discoveredSources,
        auditStatus: 'solo_inquiry',
      },
      researchMetrics: {
        durationMs,
        claimsIdentified: 0,
        claimsSupported: 0,
        claimsContradicted: 0,
        claimsUnresolved: 0,
        sourcesConsulted: discoveredSources.length,
        primarySourcesCount: 0,
        consensusRate: null, // Truthful: No consensus measurement in solo mode
      },
    };
  }

  try {
    const extractionPrompt = `You are a rigorous research auditor for an evidence-grounded research platform.
Analyze this technical debate transcript and return a valid JSON object extracting the real evidence graph.

USER QUESTION:
${prompt}

SOURCES DISCOVERED:
${JSON.stringify(discoveredSources.map((s) => ({ title: s.title, url: s.url, domain: s.domain, snippet: s.snippet })))}

ANALYST PROPOSAL EXCERPT:
${proposalContent.slice(0, 1500)}

CRITIC OBJECTIONS EXCERPT:
${critiqueContent.slice(0, 1500)}

FINAL SYNTHESIS EXCERPT:
${finalSynthesis.slice(0, 2000)}

OUTPUT ONLY A VALID JSON OBJECT WITH THIS EXACT STRUCTURE (no backticks, no markdown):
{
  "researchPlan": [
    "Subquestion 1 investigated",
    "Subquestion 2 investigated"
  ],
  "claims": [
    {
      "id": "claim-1",
      "claim": "Specific assertion extracted from findings",
      "status": "supported",
      "confidence": 85,
      "supportingSources": [{"title": "Source name", "url": "https://...", "snippet": "relevant quote"}],
      "counterEvidence": [],
      "analystStance": "Position in proposal",
      "criticStance": "Caveat or objection",
      "reviewerVerdict": "Final resolution"
    }
  ],
  "contradictions": [
    {
      "id": "contra-1",
      "claimA": "Position A",
      "claimB": "Position B",
      "description": "Why these positions were in conflict",
      "resolutionStatus": "resolved",
      "reconciledResolution": "Resolution"
    }
  ]
}`;

    const rawResult = await callAgentWithStream({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      apiKey: apiKey || env.GEMINI_API_KEY,
      systemInstruction: 'You extract structured evidence graphs from research transcripts in valid JSON.',
      userPrompt: extractionPrompt,
      temperature: 0.1,
      enableSearchGrounding: false,
      onChunk: () => {},
      env,
    });

    const cleaned = rawResult.replace(/```json/gi, '').replace(/```/gi, '').trim();
    const parsed = JSON.parse(cleaned);

    const researchPlan = Array.isArray(parsed.researchPlan) && parsed.researchPlan.length > 0
      ? parsed.researchPlan
      : [];

    const claims = Array.isArray(parsed.claims) ? parsed.claims : [];
    const contradictions = Array.isArray(parsed.contradictions) ? parsed.contradictions : [];

    const claimsIdentified = claims.length;
    const claimsSupported = claims.filter((c: any) => c.status === 'supported').length;
    const claimsContradicted = claims.filter((c: any) => c.status === 'contradicted').length;
    const claimsUnresolved = claims.filter((c: any) => c.status === 'unresolved').length;
    const sourcesConsulted = discoveredSources.length;

    // Real, unclamped calculation: only compute rate when claims were actually identified
    const consensusRate = claimsIdentified > 0
      ? Math.round(((claimsSupported + 0.5 * (claimsIdentified - claimsContradicted - claimsUnresolved)) / claimsIdentified) * 100)
      : null;

    const researchMetrics = {
      durationMs,
      claimsIdentified,
      claimsSupported,
      claimsContradicted,
      claimsUnresolved,
      sourcesConsulted,
      primarySourcesCount: 0,
      consensusRate,
    };

    const evidenceGraph = {
      researchPlan,
      claims,
      contradictions,
      sourcesConsulted: discoveredSources,
      auditStatus: claimsIdentified > 0 ? 'audited' : 'insufficient_evidence',
    };

    return { evidenceGraph, researchMetrics };
  } catch (err) {
    console.warn('Evidence graph extraction could not parse structured findings:', err);
    return {
      evidenceGraph: {
        researchPlan: [],
        claims: [],
        contradictions: [],
        sourcesConsulted: discoveredSources,
        auditStatus: 'incomplete',
      },
      researchMetrics: {
        durationMs,
        claimsIdentified: 0,
        claimsSupported: 0,
        claimsContradicted: 0,
        claimsUnresolved: 0,
        sourcesConsulted: discoveredSources.length,
        primarySourcesCount: 0,
        consensusRate: null, // Truthful: Report null on audit failure
      },
    };
  }
}
