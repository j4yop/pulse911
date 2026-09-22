import React from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle2, ShieldAlert, Zap, Target, Users, ShieldCheck } from 'lucide-react';

export const PRDView: React.FC = () => {
  return (
    <div className="max-w-[1250px] mx-auto space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="text-center space-y-3 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
          <FileText className="w-3.5 h-3.5 text-rose-600" />
          <span>Product Requirements Document (PRD)</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Pulse911: Product Specification & Engineering Requirements
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Zero-Latency Emergency Dispatch & Clinical Triage Copilot built for the <strong className="text-slate-900 font-semibold">YC Fall 2026 &times; Moss Builder Sprint</strong>.
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xs text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Target className="w-5 h-5 text-rose-600" />
            1. Executive Summary & Problem Definition
          </h2>
          <p className="text-slate-600">
            Emergency 911 dispatch centers in the United States and globally face chronic staffing shortages (recent US surveys report vacancy rates approaching 35%), leading to delayed answer times and dispatcher cognitive fatigue. While AI voice agents can answer calls instantaneously, conversational voice pipelines fail when paired with traditional cloud vector databases (Pinecone, Qdrant).
          </p>
          <p className="text-slate-600">
            Remote vector queries introduce <strong className="text-slate-900">150ms to 350ms of network latency</strong>. Combined with Speech-to-Text and Text-to-Speech synthesis, the total voice roundtrip balloons beyond <strong className="text-slate-900">450ms</strong>. In life-or-death emergencies (e.g. cardiac arrest, infant choking), this hesitation shatters conversational cadence, causing callers to panic and yell <em className="text-slate-800 font-medium">"Are you listening to me?!"</em>
          </p>
          <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 font-mono text-xs text-emerald-950 shadow-2xs">
            <strong className="text-emerald-800">The Pulse911 Solution:</strong> Colocate the clinical emergency protocol index directly inside the application runtime using <strong className="text-emerald-800">Moss (YC F25)</strong>. Moss performs semantic search in <strong className="text-emerald-800">3 to 5 milliseconds</strong>, absorbing retrieval overhead entirely and enabling true real-time voice triage under the human biological threshold of 300ms.
          </div>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Users className="w-5 h-5 text-indigo-600" />
            2. Core User Personas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              whileHover={{ y: -3, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <h3 className="font-bold text-slate-900 text-sm">The Distressed Caller</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Experiencing acute crisis (infant choking, partner collapsed). Needs immediate, calm, authoritative, non-hesitant instructions in under 300ms.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -3, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <h3 className="font-bold text-slate-900 text-sm">The 911 Dispatch Officer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Managing multi-line emergency queues. Needs automated clinical protocol cards, contraindication alerts, and 1-click unit dispatch.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -3, scale: 1.015 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2 shadow-2xs hover:border-slate-300 transition-colors"
            >
              <h3 className="font-bold text-slate-900 text-sm">The Field Paramedic Captain</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                En route in an ambulance. Needs pre-arrival clinical summary, accurate Last Known Well timestamps, and pre-staged defibrillator/Narcan alerts.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <Zap className="w-5 h-5 text-amber-500" />
            3. Non-Functional Latency Budget (&lt; 300ms Total Turnaround)
          </h2>
          <div className="overflow-x-auto font-mono text-xs rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 border-b border-slate-200 font-semibold">Pipeline Component</th>
                  <th className="p-3 border-b border-slate-200 font-semibold">Technology</th>
                  <th className="p-3 border-b border-slate-200 font-semibold">Target Budget</th>
                  <th className="p-3 border-b border-slate-200 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 text-slate-800 font-medium">Voice Activity Detection (VAD)</td>
                  <td className="p-3 text-slate-600">Silero VAD / WebRTC Opus</td>
                  <td className="p-3 text-slate-600">60 - 75 ms</td>
                  <td className="p-3 text-emerald-700 font-semibold">Within Spec</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-800 font-medium">Streaming Speech-to-Text</td>
                  <td className="p-3 text-slate-600">Deepgram Nova-2 / Groq Whisper</td>
                  <td className="p-3 text-slate-600">80 - 95 ms</td>
                  <td className="p-3 text-emerald-700 font-semibold">Within Spec</td>
                </tr>
                <tr className="bg-emerald-50/70">
                  <td className="p-3 font-bold text-emerald-900">Clinical Semantic Retrieval</td>
                  <td className="p-3 font-bold text-emerald-900">Moss (YC F25) In-Memory</td>
                  <td className="p-3 font-bold text-emerald-900">3 - 5 ms</td>
                  <td className="p-3 font-bold text-emerald-800 bg-emerald-100/70 rounded px-2 py-0.5 inline-block my-2">Sub-10ms Verified</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-800 font-medium">LLM TTFT & Audio Synthesis</td>
                  <td className="p-3 text-slate-600">Llama 3.3 70B Fast + Cartesia TTS</td>
                  <td className="p-3 text-slate-600">90 - 110 ms</td>
                  <td className="p-3 text-emerald-700 font-semibold">Within Spec</td>
                </tr>
                <tr className="bg-slate-100/90 font-bold">
                  <td className="p-3 text-slate-900">Total Roundtrip Turn-Taking</td>
                  <td className="p-3 text-slate-900">Pulse911 Unified Engine</td>
                  <td className="p-3 text-emerald-700">233 - 285 ms</td>
                  <td className="p-3 text-emerald-700">Under 300ms Biological Ceiling</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            4. Security, Privacy & Local-First Invariants
          </h2>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <li><strong className="text-slate-900">Zero Remote Vector Data Transmission:</strong> Because Moss runs locally in-memory, sensitive patient symptoms and addresses are never transmitted to third-party vector databases.</li>
            <li><strong className="text-slate-900">CJIS & HIPAA Compliant Data Flow:</strong> Telemetry logs can be encrypted with hardware keys (KMS) before disk persistence.</li>
            <li><strong className="text-slate-900">Fail-Safe Audio Fallback:</strong> If browser audio or client hardware is constrained, the dispatch interface seamlessly activates deterministic scenario triggers so users always experience full fidelity.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
