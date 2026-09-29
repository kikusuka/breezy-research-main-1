import React, { useState } from 'react';
import { SynapNotebook, SynapSource, SynapStudyItem } from '../../types/synap';
import { synapService } from '../../services/synapService';
import { retrieveRelevantChunks } from '../../services/synapDatabase';
import { verifyQuoteVerbatim } from '../../services/scheduler';

interface ExplainItBackViewProps {
  notebook: SynapNotebook;
  onAddStudyItems: (items: SynapStudyItem[]) => void;
  onUpdateNotebook: (nb: SynapNotebook) => void;
  toast: (msg: string) => void;
}

interface ClaimEvaluation {
  claim: string;
  status: 'supported' | 'contradicted' | 'unsupported by sources';
  chunkId?: string;
  quote?: string;
  unverified?: boolean;
}

interface MissingPoint {
  point: string;
  chunkId: string;
  quote: string;
  unverified?: boolean;
}

interface EvaluationResult {
  claims: ClaimEvaluation[];
  missing: MissingPoint[];
  probe: string;
}

export const SynapExplainItBackView: React.FC<ExplainItBackViewProps> = ({
  notebook,
  onAddStudyItems,
  onUpdateNotebook,
  toast,
}) => {
  const [concept, setConcept] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  // Suggested concept quick chips from the notebook's topic list
  const suggestedTopics = (notebook.topicTree || []).slice(0, 5).map((t) => t.name);

  const handleSubmitExplanation = async () => {
    if (!concept.trim() || !explanation.trim()) {
      toast('Please specify a concept and provide your explanation.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // 1. Retrieve the relevant source chunks matching the topic/concept
      const relevantChunks = await retrieveRelevantChunks(notebook.id, concept, 5);

      if (relevantChunks.length === 0) {
        toast("Your sources don't cover this well enough to verify.");
        setLoading(false);
        return;
      }

      // Format source context for prompt matching
      const contextText = relevantChunks
        .map((ch) => `[Chunk ID: ${ch.id}] (Source: ${ch.sourceTitle})\n${ch.text}`)
        .join('\n\n');

      const systemPrompt = `You are Synap's active recall auditor. Verify the student's explanation against the course texts.
Return STRICT valid JSON matching this schema exactly, with NO outer wrappers, NO markdown tags, and NO extra characters:
{
  "claims": [
    {
      "claim": "student's sentence or claim",
      "status": "supported" | "contradicted" | "unsupported by sources",
      "chunkId": "Chunk ID matching the source",
      "quote": "verbatim text quote from the cited chunk backing this status"
    }
  ],
  "missing": [
    {
      "point": "important point from the snippets the student missed",
      "chunkId": "Chunk ID",
      "quote": "verbatim text quote of the missed concept"
    }
  ],
  "probe": "one warm follow-up question testing the weakest part of their explanation"
}`;

      const userPrompt = `Course Snippets:\n${contextText}\n\nConcept to Explain: ${concept}\n\nStudent Explanation:\n${explanation}`;

      const provider = synapService.getProvider();
      let rawJson = '';

      if (provider.type === 'gemini') {
        const key = provider.key || '';
        if (!key) {
          toast('Google Gemini key unconfigured. Please set your key in Synap Settings.');
          setLoading(false);
          return;
        }
        const ai = new (await import('@google/genai')).GoogleGenAI({ apiKey: key });
        const resp = await ai.models.generateContent({
          model: provider.model || 'gemini-3.8-flash',
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
          },
        });
        rawJson = resp.text || '';
      } else {
        rawJson = await synapService.queryGroundedAI(notebook.id, `${systemPrompt}\n\n${userPrompt}`, "You output raw JSON only.");
      }

      // Parse JSON safely
      const cleaned = rawJson.replace(/```json|```/g, '').trim();
      const startIdx = cleaned.indexOf('{');
      if (startIdx === -1) throw new Error('Failed to isolate JSON envelope.');
      const parsed: EvaluationResult = JSON.parse(cleaned.slice(startIdx));

      // 2. Perform Code-Level Quote Verification (Strict verbatim matching against sources)
      const verifiedClaims = parsed.claims.map((claim) => {
        if (claim.chunkId && claim.quote) {
          const matchedChunk = relevantChunks.find((c) => c.id === claim.chunkId);
          if (!matchedChunk || !verifyQuoteVerbatim(claim.quote, matchedChunk.text)) {
            return { ...claim, unverified: true };
          }
        }
        return claim;
      });

      const verifiedMissing = parsed.missing.map((pt) => {
        if (pt.chunkId && pt.quote) {
          const matchedChunk = relevantChunks.find((c) => c.id === pt.chunkId);
          if (!matchedChunk || !verifyQuoteVerbatim(pt.quote, matchedChunk.text)) {
            return { ...pt, unverified: true };
          }
        }
        return pt;
      });

      setResult({
        claims: verifiedClaims,
        missing: verifiedMissing,
        probe: parsed.probe,
      });

    } catch (err) {
      console.error('Error auditing explanation:', err);
      toast('Failed to analyze explanation. Please verify your course documents and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMakeFlashcard = async (title: string, definition: string) => {
    // 1. Create a new flashcard item due today
    const newCard: SynapStudyItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'flashcard',
      topic: concept,
      prompt: `Explain the concept: ${title}`,
      answer: definition,
      reference: `Explain It Back Verification`,
      vulnerability: 'moderate',
      history: [],
    };

    // 2. Scan if student has an existing matching card on this exact concept to record a lapse
    let lapseRecorded = false;
    const updatedStudyItems = (notebook.studyItems || []).map((card) => {
      if (card.topic?.toLowerCase() === concept.toLowerCase() || card.prompt.toLowerCase().includes(title.toLowerCase())) {
        lapseRecorded = true;
        const currentLapses = (card as any).lapses || 0;
        return {
          ...card,
          lapses: currentLapses + 1,
          repetitions: 0,
          interval: 1,
          dueDate: new Date().toISOString().split('T')[0],
        };
      }
      return card;
    });

    const finalStudyItems = lapseRecorded ? updatedStudyItems : [...(notebook.studyItems || []), newCard];

    // Save back to DB asynchronously
    const updatedNb = {
      ...notebook,
      studyItems: finalStudyItems,
    };
    await synapService.saveNotebook(updatedNb);
    onUpdateNotebook(updatedNb);

    if (lapseRecorded) {
      toast(`Registered study lapse on matching existing card for "${title}". Interval reset to 1 day.`);
    } else {
      toast(`Created custom active recall card for "${title}"!`);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto font-sans p-2">
      {/* Active Header Instruction */}
      <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4">
        <h2 className="text-lg font-bold text-stone-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-400">psychology_alt</span>
          <span>"Explain It Back" Active Study Review</span>
        </h2>
        <p className="text-xs text-stone-400 leading-relaxed">
          The ultimate memory integration technique. Explain a concept in your own words, and Synap will cross-examine your arguments strictly against your uploaded documents to isolate omissions, contradictions, and gaps.
        </p>
      </div>

      {!result && (
        <div className="flex flex-col gap-5 bg-[#14141d] p-6 rounded-2xl border border-white/5 shadow-xl">
          {/* Concept Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-stone-300">What concept are you explaining?</label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. Mitochondria, Big-O Notation, TCP Handshake..."
              className="w-full bg-[#1b1b26] text-stone-100 border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-purple-500 transition-colors"
            />
            {suggestedTopics.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">Suggested from sources:</span>
                {suggestedTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setConcept(topic)}
                    className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/5 text-stone-300 px-2 py-0.5 rounded-full transition-all cursor-pointer"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Explanation Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-stone-300">Your Explanation:</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Write everything you remember about this concept. Don't check your notes yet—test your recall..."
              className="w-full bg-[#1b1b26] text-stone-100 border border-white/10 rounded-xl p-3.5 text-xs outline-none focus:border-purple-500 transition-colors min-h-[160px] leading-relaxed resize-none"
            />
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleSubmitExplanation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-500/10 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
                <span>Analysing your recall against course material...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[17px]">gavel</span>
                <span>Audit My Explanation</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Results Display Pane */}
      {result && (
        <div className="flex flex-col gap-6">
          {/* Header Reset */}
          <div className="flex items-center justify-between bg-[#14141d] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
              <span className="text-stone-300">Reviewing explanation of: <strong>{concept}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setExplanation('');
                setResult(null);
              }}
              className="text-xs text-purple-400 hover:underline cursor-pointer"
            >
              Try another concept ↗
            </button>
          </div>

          {/* Answer Claim Segmentation */}
          <div className="bg-[#14141d] p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <span className="text-xs font-semibold text-stone-200">Fact-Check Analysis of Your Answer</span>
            <div className="p-4 rounded-xl bg-[#1b1b26] leading-relaxed text-xs text-stone-300 flex flex-col gap-3">
              {result.claims.map((claim, idx) => {
                const colorClass =
                  claim.status === 'supported'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : claim.status === 'contradicted'
                    ? 'bg-red-500/10 text-red-300 border-red-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20';

                return (
                  <div key={idx} className={`p-3 rounded-lg border flex flex-col gap-2 ${colorClass}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">"{claim.claim}"</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-black/20">
                        {claim.status}
                      </span>
                    </div>

                    {claim.quote && (
                      <div className="mt-1 pl-2 border-l-2 border-white/10 text-[11px] text-stone-400 italic">
                        {claim.unverified ? (
                          <span className="text-red-400 flex items-center gap-1 font-sans">
                            <span className="material-symbols-outlined text-[12px]">warning</span>
                            could not verify quote against your sources
                          </span>
                        ) : (
                          <span>Verbatim Source Quote: "{claim.quote}"</span>
                        )}
                      </div>
                    )}

                    {claim.status === 'contradicted' && (
                      <div className="flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={() => handleMakeFlashcard(claim.claim, claim.quote || 'Re-study this concept')}
                          className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">add_circle</span>
                          <span>Make Correction Card</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Omitted / Missing Concepts */}
          <div className="bg-[#14141d] p-5 rounded-2xl border border-white/5 flex flex-col gap-4">
            <span className="text-xs font-semibold text-stone-200">Essential Omissions from Sources</span>
            {result.missing.length > 0 ? (
              <div className="flex flex-col gap-3">
                {result.missing.map((pt, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/10 text-xs flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-stone-200">Missed Point: {pt.point}</span>
                        {pt.quote && (
                          <p className="text-[11px] text-stone-400 italic mt-1 leading-relaxed">
                            {pt.unverified ? (
                              <span className="text-red-400 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">warning</span>
                                could not verify quote against your sources
                              </span>
                            ) : (
                              `"${pt.quote}"`
                            )}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleMakeFlashcard(pt.point, pt.quote)}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/20 text-purple-300 text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">add_circle</span>
                        <span>Make Card</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">
                🎉 Brilliant! You covered all key points found in your referenced documents. Outstanding memory synthexis!
              </p>
            )}
          </div>

          {/* Next Probe Question */}
          <div className="bg-[#14141d] p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
            <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-400 text-[16px]">help_center</span>
              <span>Next Cognitive Probe Question</span>
            </span>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-xs leading-relaxed text-stone-300">
              <p className="font-medium text-stone-100">{result.probe}</p>
              <button
                type="button"
                onClick={() => {
                  setExplanation('');
                  setConcept(concept + ' - Followup');
                  setResult(null);
                  toast("Input loaded. Explain this specific prompt to continue the audit trail!");
                }}
                className="mt-3 text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <span>Answer This Follow-Up Question ↗</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
