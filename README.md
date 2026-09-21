# 🚑 Pulse911: Zero-Latency Emergency Dispatch & Clinical Triage Voice AI

> **Sub-10ms Medical Protocol Retrieval & Dispatch Copilot Powered by Moss (YC F25)**  
> *Target Sprint:* **YC Fall 2026 × Moss: The Zero Latency Builder Sprint** (HiDevs AI & Moss YC F25)  
> *Track:* **Y Combinator Fall 2026 Requests for Startups** (AI-Native Critical Services & Infrastructure)  
> *Stack:* **Moss (YC F25) — @moss-dev/moss-web WASM runtime** • **WebRTC (getUserMedia) + Web Audio API** • **React 19** • **Tailwind CSS v4** • **Vite**

---

## 1. The Crisis: The 300ms Biological Ceiling in Emergency Voice AI

In 2026, 911 dispatch centers face chronic operator shortages (recent US surveys report vacancy rates approaching 35%), leading to agonizing hold times and fatal delays. While conversational AI voice agents can answer incoming calls instantly, traditional RAG architectures collapse under pressure:

* **The Cloud Vector DB Penalty:** Querying a remote vector database (Pinecone, Qdrant, Weaviate) introduces **150ms to 350ms of network latency**.
* **Breaking the Conversation:** When combined with speech-to-text and audio synthesis, total roundtrip turnaround balloons past **480ms**. 
* **The Panic Trigger:** Human conversational turn-taking has a hard biological ceiling at **300ms**. If an emergency bot pauses for half a second before giving CPR instructions, the caller panics, yells *"Are you listening to me?!"*, and precious seconds are lost.

### The Pulse911 Solution: Colocated Zero-Latency Retrieval
**Pulse911** replaces network-dependent vector databases with **Moss (YC F25)**:
* **Single-Digit-ms Semantic Search:** Moss embeds clinical emergency protocols into an in-process WASM index, retrieving the matching pathway in single-digit milliseconds — measured by the SDK itself on every query.
* **Under the 300ms Ceiling:** In our modeled latency budget (VAD + STT + retrieval + LLM TTFT + TTS), sub-10ms retrieval keeps total voice turnaround at ~260ms, allowing the AI agent to give authoritative, life-saving instructions without awkward pauses.
* **Dual-Channel Dispatch:** Simultaneously streams calm, spoken guidance into the caller's ear while pushing pre-populated CAD unit dispatches, contraindication warnings, and 110 BPM CPR metronome pulses to the operator HUD.

---

## 2. Key Features

1. **Sub-10ms Moss Semantic Retrieval:** Evaluates emergency protocols (cardiac, airway, stroke, anaphylaxis, opioid, cyber-extortion) in single-digit milliseconds via the real **@moss-dev/moss-web** WASM runtime — measured live on every query, with a clearly-labeled deterministic fallback if Moss Cloud is unreachable.
2. **One-Click Emergency Presets:** 5 scenarios (*Adult Cardiac Arrest*, *Infant Choking*, *Acute Stroke FAST*, *Severe Anaphylaxis*, *Digital-Arrest Scam Interception*) for instantaneous, reproducible evaluation.
3. **Live WebRTC Audio & Waveform:** Real-time microphone ingestion, speech-to-text token streaming, and canvas-rendered voice waveforms.
4. **Interactive CPR Metronome:** Integrated 110 BPM acoustic rhythm generator for chest compression pacing.
5. **CAD Paramedic Dispatch:** Automatically assigns the nearest ALS paramedic rescue engine with required equipment.
6. **Live Latency Benchmark Runner:** Runs a real 50-query statistical benchmark (P50/P95/P99) of the Moss WASM runtime in your browser, compared against *cited* cloud vector-DB figures from Moss's published 100k-document benchmarks.

---

## 3. Quickstart Guide (Runs in 30 Seconds)

### Prerequisites
* Node.js 18+ (tested on Node 22 and 24)
* npm or pnpm

### Step 1: Clone and Install
```bash
git clone https://github.com/j4yop/pulse911.git
cd pulse911

# Install dependencies
npm install
```

# Configure Moss Cloud (free tier): sign up at https://moss.dev and create a project.
# Then create a .env.local file in the repo root:
#
#   VITE_MOSS_PROJECT_ID=your_project_id
#   VITE_MOSS_PROJECT_KEY=your_project_key
#
# Without credentials the app still runs end-to-end using a clearly-labeled
# deterministic local fallback (no synthetic latency numbers are ever shown).

### Step 2: Start the Development Server
```bash
npm run dev
```

Navigate to: **`http://localhost:3000`**

### Step 3: Run the Build Check
```bash
npm run build
```

---

## 4. 2-Minute Video Demo Playbook

| Timestamp | Script & Action | What is on Screen |
| :--- | :--- | :--- |
| **0:00 – 0:25** | *"In emergency 911 dispatch, every millisecond counts. When someone calls about a heart attack, waiting 400ms for a cloud vector database breaks the call and triggers panic. Meet Pulse911: the zero-latency emergency dispatch copilot powered by Moss."* | Show clean Pulse911 dual-channel console with the live Moss latency badge showing single-digit measured latency. |
| **0:25 – 0:55** | Click scenario: **"Adult Cardiac Arrest (58M)"**. Speech begins: *"My boss collapsed out of nowhere! He's not breathing!"* | **The Latency Shock:** In single-digit ms (watch the live badge), Moss retrieves AHA Protocol `CARD-01`. The voice agent speaks instantly: *"Put me on speaker. Lay him flat on the floor right now. Push hard and fast in the center of his chest."* |
| **0:55 – 1:20** | Click **"CPR Rhythm (110 BPM)"**. | The acoustic metronome starts clicking at 110 BPM to guide chest compressions. On the HUD, Medic 14 is automatically dispatched with Lucas mechanical CPR device, ETA (simulated). |
| **1:20 – 1:45** | Switch to the **"Moss vs Vector DBs"** tab and click **"Run Live Latency Benchmark"**. | Show the 300ms biological ceiling diagram: cited cloud vector-DB latency bars vs the measured Moss bar; highlight the ~70x+ gap vs the cited Pinecone/Qdrant figures. |
| **1:45 – 2:00** | *"By bringing sub-10ms retrieval directly into the voice loop with Moss, Pulse911 turns latency into a life-saving competitive moat. Built for the YC Fall 2026 Builder Sprint. Thank you!"* | Bring up the Architecture Diagram showing the Moss in-memory retrieval layer. |

---

## 5. Submission Copy for HiDevs Arena

* **Project Title:** Pulse911: Zero-Latency Emergency Dispatch & Clinical Triage Voice AI
* **Tagline:** Sub-10ms emergency voice dispatch copilot using Moss to keep AI conversational turnaround under the 300ms human biological ceiling.
* **Why Moss Matters Here:** Emergency voice AI cannot tolerate 200ms+ remote vector database roundtrips. Moss executes clinical protocol retrieval in-process in single-digit milliseconds (SDK-measured on every query), keeping our modeled total voice turnaround under the 300ms human conversational ceiling and saving critical seconds during active resuscitation.

---

## 6. License
MIT License. Built for the YC Fall 2026 × Moss: The Zero Latency Builder Sprint.
