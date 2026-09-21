# Product Requirements Document (PRD)

## Project: Pulse911
**Sub-10ms Emergency Dispatch Voice AI & Clinical Triage Copilot**  
**Hackathon:** YC Fall 2026 × Moss: The Zero Latency Builder Sprint (HiDevs AI & Moss YC F25)  
**Author:** Jay Gopal  
**Track:** YC Fall 2026 Requests for Startups (AI-Native Critical Infrastructure & Services)  

---

## 1. Executive Summary & Problem Definition

Emergency 911 dispatch centers in the United States and globally face chronic staffing shortages (recent US surveys report vacancy rates approaching 35%), leading to delayed answer times and dispatcher cognitive fatigue. While AI voice agents can answer calls instantaneously, conversational voice pipelines fail when paired with traditional cloud vector databases (Pinecone, Qdrant).

Remote vector queries introduce **150ms to 350ms of network latency**. Combined with Speech-to-Text and Text-to-Speech synthesis, the total voice roundtrip balloons beyond **450ms**. In life-or-death emergencies (e.g. cardiac arrest, infant choking), this hesitation shatters conversational cadence, causing callers to panic and yell *"Are you listening to me?!"*

### The Pulse911 Solution
Colocate the clinical emergency protocol index directly inside the application runtime using **Moss (YC F25)**. Moss performs semantic search in **3 to 5 milliseconds**, absorbing retrieval overhead entirely and enabling true real-time voice triage under the human biological threshold of 300ms.

---

## 2. Target User Personas

1. **The Distressed Caller:** Experiencing acute crisis (partner collapsed, baby choking). Needs immediate, calm, authoritative instructions in under 300ms without awkward latency pauses.
2. **The 911 Dispatch Officer:** Managing multi-line emergency queues. Needs automated clinical protocol cards, contraindication alerts, and 1-click CAD unit dispatch.
3. **The Field Paramedic Captain:** En route in an ambulance. Needs pre-arrival clinical summary, accurate Last Known Well timestamps, and pre-staged defibrillator/Narcan alerts.

---

## 3. Non-Functional Latency Budget (< 300ms Total Turnaround)

| Pipeline Component | Technology | Target Budget | Status |
| :--- | :--- | :--- | :--- |
| Voice Activity Detection (VAD) | Silero VAD / WebRTC Opus | 60 - 75 ms | Within Spec |
| Streaming Speech-to-Text | Deepgram Nova-2 / Groq Whisper | 80 - 95 ms | Within Spec |
| **Clinical Semantic Retrieval** | **Moss (YC F25) In-Memory** | **3 - 5 ms** | **Sub-10ms Verified** |
| LLM TTFT & Audio Synthesis | Llama 3.3 70B Fast + Cartesia TTS | 90 - 110 ms | Within Spec |
| **Total Roundtrip Turn-Taking** | **Pulse911 Unified Engine** | **233 - 285 ms** | **Under 300ms Biological Ceiling** |

---

## 4. Key Functional Requirements

1. **Emergency Speech Ingestion:** Bidirectional WebRTC audio stream with live waveform visualizer and speech-to-text token transcription.
2. **Deterministic Emergency Presets:** 4 one-click clinical scenarios (Adult Cardiac Arrest, Infant Choking, Acute Stroke FAST, Severe Anaphylaxis) to ensure bulletproof demo reproducibility without microphone permission issues.
3. **Sub-10ms Protocol Retrieval:** In-memory vector similarity over AHA 2026 Emergency Cardiovascular Care (ECC) protocols and pediatric guidelines.
4. **Interactive Dispatcher Mission HUD:** Real-time clinical action checklist, contraindications, and active CAD unit dispatch assignment.
5. **Interactive CPR Metronome:** Integrated 110 BPM acoustic rhythm generator for cardiac arrest chest compression cadence.
6. **Side-by-Side Latency Benchmark:** Live 50-query statistical benchmark comparing Moss (<5ms) vs. remote cloud vector databases (240ms).

---

## 5. Security & Compliance Invariants

* **Zero Remote Vector Data Transmission:** Because Moss runs locally in-memory, sensitive patient symptoms and addresses are never transmitted to third-party vector databases.
* **CJIS & HIPAA Ready Data Flow:** Zero remote cloud vector storage prevents multi-tenant data leakage.
