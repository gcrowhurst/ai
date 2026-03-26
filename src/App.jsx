import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "biz-board-v2";

function storageGet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function storageSet(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function storageClear() {
  localStorage.removeItem(STORAGE_KEY);
}

const BUSINESS_QUESTIONS = [
  {
    id: "product",
    label: "The Product",
    question: "What does this business sell?",
    hint: "Be creative — products, services, experiences. The weirder the better.",
    placeholder: "e.g. Edible furniture for pets, time-travel insurance...",
    emoji: "\u{1F6CD}\uFE0F",
  },
  {
    id: "customer",
    label: "Target Customer",
    question: "Who is the ideal (unlikely) customer?",
    hint: "Think of the most unexpected demographic.",
    placeholder: "e.g. Retired astronauts, anxious cats, medieval re-enactors...",
    emoji: "\u{1F3AF}",
  },
  {
    id: "name",
    label: "Business Name",
    question: "What is the business called?",
    hint: "Make it memorable. Puns welcome.",
    placeholder: "e.g. Chairish the Moment, Paws & Effect...",
    emoji: "\u2728",
  },
  {
    id: "slogan",
    label: "The Slogan",
    question: "What's the company slogan?",
    hint: "Channel your inner Mad Men. Keep it punchy.",
    placeholder: "e.g. 'Because gravity is optional'...",
    emoji: "\u{1F4E3}",
  },
  {
    id: "origin",
    label: "Origin Story",
    question: "How did the founder come up with this idea?",
    hint: "The stranger the origin story, the better.",
    placeholder: "e.g. Fell asleep in IKEA and had a vision...",
    emoji: "\u{1F4A1}",
  },
  {
    id: "disaster",
    label: "Year One Disaster",
    question: "What went spectacularly wrong in year one?",
    hint: "Every great business has a crisis. What was theirs?",
    placeholder: "e.g. The CEO turned out to be three raccoons in a trenchcoat...",
    emoji: "\u{1F4A5}",
  },
  {
    id: "pivot",
    label: "The Pivot",
    question: "How did they heroically recover?",
    hint: "Out of disaster comes innovation.",
    placeholder: "e.g. Partnered with NASA, went underground (literally)...",
    emoji: "\u{1F680}",
  },
  {
    id: "feature",
    label: "Killer Feature",
    question: "What's the one feature that makes this product irresistible?",
    hint: "The thing competitors can't replicate.",
    placeholder: "e.g. It glows in the dark, it reads your mood...",
    emoji: "\u26A1",
  },
  {
    id: "testimonial",
    label: "Customer Testimonial",
    question: "Write a fake 5-star customer review.",
    hint: "Be dramatic. Be emotional. Be ridiculous.",
    placeholder: "e.g. 'This product saved my marriage AND my souffl\u00E9. 10/10'...",
    emoji: "\u2B50",
  },
  {
    id: "future",
    label: "Future Vision",
    question: "Where is this business in 10 years?",
    hint: "Dream big. World domination? Space expansion? IPO on Mars?",
    placeholder: "e.g. Franchises on every continent including Antarctica...",
    emoji: "\u{1F52E}",
  }
];

const PROMPT_TEMPLATES = [
  {
    title: "Quick Quiz Generator",
    icon: "\u{1F4DD}",
    template: `I teach [SUBJECT] to [LEVEL] students. My lesson is about "[LESSON TITLE]".

The learning outcomes are:
- [OUTCOME 1]
- [OUTCOME 2]
- [OUTCOME 3]

Please create a 10-question interactive quiz that:
- Mixes question types (multiple choice, true/false, short answer)
- Progresses from recall to application
- Includes feedback for wrong answers explaining WHY
- Aligns each question to a specific learning outcome

Format it clearly so I could transfer it to our VLE.`
  },
  {
    title: "Scenario-Based Assessment",
    icon: "\u{1F3AD}",
    template: `I need a scenario-based assessment for my [SUBJECT] lesson on "[TOPIC]".

Students are [LEVEL] and should demonstrate they can:
- [OUTCOME 1]
- [OUTCOME 2]

Create a realistic workplace/real-world scenario where students must:
1. Identify the problem
2. Apply their knowledge to solve it
3. Justify their decisions

Include a marking rubric with clear criteria at Pass, Merit, and Distinction levels.`
  },
  {
    title: "Differentiated Assessment Pack",
    icon: "\u{1F39A}\uFE0F",
    template: `I teach a mixed-ability [SUBJECT] class. The topic is "[TOPIC]".

Learning outcomes: [LIST OUTCOMES]

Please create THREE versions of an assessment:
1. FOUNDATION: Scaffolded questions with prompts and word banks
2. INTERMEDIATE: Open questions requiring explanation
3. ADVANCED: Extended response with analysis/evaluation

All three must assess the SAME outcomes but at different cognitive demands. Include an answer guide.`
  },
  {
    title: "Practical Skills Checklist",
    icon: "\u{1F527}",
    template: `I need an observation checklist for a practical assessment in [SUBJECT].

The task is: [DESCRIBE PRACTICAL TASK]

Students should demonstrate:
- [SKILL 1]
- [SKILL 2]
- [SKILL 3]

Create a checklist that:
- Breaks each skill into observable steps
- Includes columns for "Not yet / Developing / Competent / Excellent"
- Has space for assessor notes
- Includes health & safety criteria where relevant`
  }
];

const ETHICS_POINTS = [
  { icon: "\u{1F441}\uFE0F", title: "Always Review", desc: "AI output is a first draft, never a final product. Check for accuracy, bias, and relevance to YOUR students." },
  { icon: "\u2696\uFE0F", title: "Bias Awareness", desc: "AI can reflect societal biases. Review for inclusive language, diverse examples, and cultural sensitivity." },
  { icon: "\u{1F512}", title: "Data Privacy", desc: "Never paste student names, data, or sensitive info into AI tools. Keep prompts anonymous." },
  { icon: "\u{1F3AF}", title: "Pedagogical Judgement", desc: "You know your students. AI doesn't. Always adapt outputs to your class context and individual needs." },
  { icon: "\u{1F4D0}", title: "Quality Assurance", desc: "Cross-check AI-generated answers and marking criteria against your subject expertise and awarding body standards." },
  { icon: "\u{1F4A1}", title: "Transparency", desc: "Be open with colleagues about AI use. Share what works. Build a culture of ethical experimentation." }
];

function App() {
  const [view, setView] = useState("welcome");
  const [userName, setUserName] = useState("");
  const [nameSet, setNameSet] = useState(false);
  const [facilitatorMode, setFacilitatorMode] = useState(false);

  // Icebreaker
  const [boardData, setBoardData] = useState({});
  const [myClaimedId, setMyClaimedId] = useState(null);
  const [mySubmitted, setMySubmitted] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [briefCopied, setBriefCopied] = useState(false);
  const pollRef = useRef(null);

  // Workshop
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [lessonInfo, setLessonInfo] = useState({ title: "", outcomes: "", methods: "", frustrations: "" });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [showEthics, setShowEthics] = useState(false);

  // Storage
  const loadBoard = () => {
    const data = storageGet();
    setBoardData(data);
  };

  const saveBoard = (newData) => {
    storageSet(newData);
    setBoardData(newData);
  };

  const claimQuestion = (qId) => {
    if (myClaimedId || mySubmitted) return;
    let current = { ...boardData };
    if (current[qId]) return;
    current[qId] = { name: userName, answer: null, time: Date.now() };
    setMyClaimedId(qId);
    saveBoard(current);
  };

  const submitAnswer = () => {
    if (!answerInput.trim() || !myClaimedId) return;
    let current = { ...boardData };
    current[myClaimedId] = { ...current[myClaimedId], answer: answerInput.trim(), time: Date.now() };
    saveBoard(current);
    setMySubmitted(true);
    setAnswerInput("");
  };

  const resetBoard = () => {
    storageClear();
    setBoardData({});
    setMyClaimedId(null);
    setMySubmitted(false);
  };

  // Polling
  useEffect(() => {
    if (view === "icebreaker") {
      loadBoard();
      pollRef.current = setInterval(loadBoard, 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [view]);

  // Restore claim on re-entry
  useEffect(() => {
    if (view === "icebreaker" && userName && Object.keys(boardData).length > 0) {
      const myEntry = Object.entries(boardData).find(([_, v]) => v.name === userName);
      if (myEntry) {
        setMyClaimedId(myEntry[0]);
        if (myEntry[1].answer) setMySubmitted(true);
      }
    }
  }, [view, boardData, userName]);

  const totalAnswered = Object.values(boardData).filter(v => v.answer).length;
  const totalClaimed = Object.keys(boardData).length;
  const allComplete = totalAnswered === BUSINESS_QUESTIONS.length;

  const buildBrief = () => {
    const lines = BUSINESS_QUESTIONS.map(q => {
      const entry = boardData[q.id];
      if (entry?.answer) return `${q.label}: ${entry.answer} (by ${entry.name})`;
      return `${q.label}: [not answered]`;
    }).join("\n");
    return `Using the following collaboratively-created fictional business details, build a fun, professional-looking single-page website. Include all the details below. Make it visually striking and entertaining:\n\n${lines}\n\nCreate a real startup landing page with sections for the product, about us / origin story, features, testimonials, and a call to action. Keep the tone playful and fun.`;
  };

  const copyBrief = () => {
    navigator.clipboard.writeText(buildBrief());
    setBriefCopied(true);
    setTimeout(() => setBriefCopied(false), 3000);
  };

  // Workshop helpers
  const copyTemplate = (idx, template) => {
    let filled = template;
    if (lessonInfo.title) filled = filled.replace(/\[LESSON TITLE\]|\[TOPIC\]/g, lessonInfo.title);
    if (lessonInfo.outcomes) {
      const outcomes = lessonInfo.outcomes.split("\n").filter(Boolean);
      outcomes.forEach((o, i) => { filled = filled.replace(`[OUTCOME ${i + 1}]`, o.trim()); });
      filled = filled.replace(/\[LIST OUTCOMES\]/g, outcomes.join(", "));
    }
    navigator.clipboard.writeText(filled);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const buildCustomPrompt = () => {
    if (!lessonInfo.title) return;
    const prompt = `I teach a lesson called "${lessonInfo.title}".

The learning outcomes are:
${lessonInfo.outcomes || "[Add your outcomes]"}

I currently assess this using: ${lessonInfo.methods || "[Your current methods]"}

${lessonInfo.frustrations ? `My main frustration with current assessment is: ${lessonInfo.frustrations}` : ""}

Please help me design a more engaging, interactive assessment that:
- Aligns directly to the learning outcomes above
- Is practical and achievable within a classroom setting
- Includes clear success criteria or a marking guide
- Engages students more than my current approach

Suggest the format, questions/tasks, and how to mark it.`;
    setGeneratedPrompt(prompt);
    navigator.clipboard.writeText(prompt);
  };

  // WELCOME
  if (view === "welcome") {
    return (
      <div style={S.page}>
        <div style={S.welcomeWrap}>
          <div style={S.chipBadge}>CPD SESSION</div>
          <h1 style={S.heroTitle}>AI-Powered<br/>Assessment Design</h1>
          <p style={S.heroSub}>A 50-minute interactive workshop</p>

          <div style={S.agenda}>
            {[
              { t: "12 min", i: "\u{1F3B2}", l: "The Worst Best Business", d: "Claim a question, build a ridiculous startup together" },
              { t: "33 min", i: "\u{1F6E0}\uFE0F", l: "Assessment Design Workshop", d: "Use Copilot to design a real assessment for your lesson" },
              { t: "5 min", i: "\u2696\uFE0F", l: "Ethics & Takeaways", d: "Responsible AI use \u2014 what to watch for" },
            ].map((a, i) => (
              <div key={i}>
                {i > 0 && <div style={S.sep} />}
                <div style={S.agendaRow}>
                  <span style={S.timePill}>{a.t}</span>
                  <div><strong style={{ fontSize: 14 }}>{a.i} {a.l}</strong><p style={S.agendaD}>{a.d}</p></div>
                </div>
              </div>
            ))}
          </div>

          {!nameSet ? (
            <div style={S.stack}>
              <input style={S.heroInput} placeholder="Enter your first name to begin..."
                value={userName} onChange={e => setUserName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && userName.trim() && setNameSet(true)} />
              <button style={{ ...S.btn, ...S.btnP, opacity: userName.trim() ? 1 : 0.4 }}
                onClick={() => userName.trim() && setNameSet(true)}>Join Session &rarr;</button>
            </div>
          ) : (
            <div style={S.stack}>
              <p style={{ color: "#6b7f92", margin: 0 }}>Welcome, <strong style={{ color: "#dde4ed" }}>{userName}</strong>!</p>
              <button style={{ ...S.btn, ...S.btnP }} onClick={() => setView("icebreaker")}>{"\u{1F3B2}"} Start Icebreaker</button>
              <button style={{ ...S.btn, ...S.btnG }} onClick={() => setView("workshop")}>{"\u{1F6E0}\uFE0F"} Jump to Workshop</button>
              <label style={S.tog}>
                <input type="checkbox" checked={facilitatorMode} onChange={e => setFacilitatorMode(e.target.checked)} />
                <span style={{ fontSize: 13, color: "#556" }}>I'm the facilitator</span>
              </label>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ICEBREAKER
  if (view === "icebreaker") {
    const getStatus = (qId) => {
      const e = boardData[qId];
      if (!e) return "open";
      if (e.answer) return "done";
      return "claimed";
    };

    const myQ = myClaimedId ? BUSINESS_QUESTIONS.find(q => q.id === myClaimedId) : null;

    return (
      <div style={S.page}>
        <div style={S.bar}>
          <button style={S.back} onClick={() => setView("welcome")}>&larr; Back</button>
          <span style={S.barTitle}>{"\u{1F3B2}"} The Worst Best Business</span>
          <span style={S.barBadge}>{totalAnswered}/{BUSINESS_QUESTIONS.length}</span>
        </div>
        <div style={S.track}><div style={{ ...S.fill, width: `${(totalAnswered / BUSINESS_QUESTIONS.length) * 100}%` }} /></div>

        {facilitatorMode && (
          <div style={S.facBar}>
            <span style={S.facPill}>FACILITATOR</span>
            <span style={{ fontSize: 13, color: "#c88" }}>{totalClaimed} claimed &middot; {totalAnswered} answered</span>
            <button style={S.facReset} onClick={resetBoard}>Reset All</button>
          </div>
        )}

        <div style={S.iceWrap}>
          {!myClaimedId && !mySubmitted && (
            <div style={S.instr}>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#8aa" }}>
                <strong>Pick one question</strong> from the board below &mdash; each shapes a different part of our fictional business.
                Once you claim it, write your answer. Together you'll build the most ridiculous startup ever.
              </p>
            </div>
          )}

          <div style={S.grid}>
            {BUSINESS_QUESTIONS.map((q) => {
              const status = getStatus(q.id);
              const entry = boardData[q.id];
              const isMine = entry?.name === userName;
              const canClaim = status === "open" && !myClaimedId && !mySubmitted;

              return (
                <div
                  key={q.id}
                  onClick={() => canClaim && claimQuestion(q.id)}
                  style={{
                    ...S.card,
                    ...(status === "done" ? S.cardDone : {}),
                    ...(status === "claimed" ? S.cardClaimed : {}),
                    ...(isMine && !mySubmitted ? S.cardMine : {}),
                    cursor: canClaim ? "pointer" : "default",
                    transform: canClaim ? undefined : "none",
                  }}
                  onMouseEnter={e => { if (canClaim) e.currentTarget.style.borderColor = "rgba(99,179,237,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = status === "done" ? "rgba(74,222,128,0.15)" : status === "claimed" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.07)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 24 }}>{q.emoji}</span>
                    <span style={{
                      width: 9, height: 9, borderRadius: "50%",
                      background: status === "done" ? "#4ade80" : status === "claimed" ? "#fbbf24" : "rgba(255,255,255,0.12)",
                      boxShadow: status === "done" ? "0 0 6px rgba(74,222,128,0.4)" : status === "claimed" ? "0 0 6px rgba(251,191,36,0.3)" : "none",
                    }} />
                  </div>

                  <strong style={{ fontSize: 13, color: "#c0cdd8", display: "block", marginBottom: 4 }}>{q.label}</strong>

                  {status === "done" && entry && (
                    <>
                      <p style={{ fontSize: 12, fontStyle: "italic", color: "#7a9aaa", margin: "2px 0 4px", lineHeight: 1.4 }}>
                        &ldquo;{entry.answer}&rdquo;
                      </p>
                      <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>&mdash; {entry.name}</span>
                    </>
                  )}

                  {status === "claimed" && !entry?.answer && (
                    <p style={{ fontSize: 12, color: "#fbbf24", margin: "4px 0 0" }}>
                      {isMine ? "\u270F\uFE0F You claimed this!" : `\u23F3 ${entry?.name} is writing...`}
                    </p>
                  )}

                  {status === "open" && canClaim && (
                    <p style={{ fontSize: 11, color: "#4a6070", margin: "auto 0 0", paddingTop: 4 }}>Click to claim</p>
                  )}
                  {status === "open" && !canClaim && (
                    <p style={{ fontSize: 11, color: "#334050", margin: "auto 0 0", fontStyle: "italic", paddingTop: 4 }}>Available</p>
                  )}
                </div>
              );
            })}
          </div>

          {myClaimedId && !mySubmitted && myQ && (
            <div style={S.answerBox}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
                <span style={{ fontSize: 30 }}>{myQ.emoji}</span>
                <div>
                  <strong style={{ fontSize: 17 }}>{myQ.question}</strong>
                  <p style={{ fontSize: 13, color: "#7a8ea0", margin: "4px 0 0" }}>{myQ.hint}</p>
                </div>
              </div>
              <textarea
                style={S.answerTA}
                placeholder={myQ.placeholder}
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                rows={3}
                maxLength={200}
                autoFocus
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#445566" }}>{answerInput.length}/200</span>
                <button style={{ ...S.btn, ...S.btnP, opacity: answerInput.trim() ? 1 : 0.4 }} onClick={submitAnswer}>
                  Submit Answer &check;
                </button>
              </div>
            </div>
          )}

          {mySubmitted && !allComplete && (
            <div style={S.doneBox}>
              <span style={{ fontSize: 26 }}>{"\u2705"}</span>
              <p style={{ margin: 0, fontSize: 15 }}><strong>You're in!</strong> Your answer is on the board. Watch the others fill in the gaps...</p>
            </div>
          )}

          {allComplete && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>{"\u{1F3C1}"} The business is complete!</h2>
              <p style={{ color: "#7a8ea0", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>
                Every question answered. Copy the brief below and paste it into Claude to generate a website live.
              </p>

              <div style={S.briefBox}>
                <pre style={S.briefPre}>{buildBrief()}</pre>
              </div>

              <button style={{ ...S.btn, ...S.btnP, ...S.btnLg, marginTop: 4 }} onClick={copyBrief}>
                {briefCopied ? "\u2713 Copied to clipboard!" : "\u{1F4CB} Copy Brief to Clipboard"}
              </button>

              <div style={S.briefNote}>
                <strong>{"\u{1F4A1}"} What just happened:</strong> Each of you contributed one piece of creative input. Now AI will synthesise it
                into a structured website &mdash; messy human creativity &rarr; polished output. That's exactly the skill you'll use next
                to design assessments with Copilot.
              </div>

              <button style={{ ...S.btn, ...S.btnG, marginTop: 14 }} onClick={() => setView("workshop")}>
                Continue to Workshop &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // WORKSHOP
  if (view === "workshop") {
    return (
      <div style={S.page}>
        <div style={S.bar}>
          <button style={S.back} onClick={() => setView("welcome")}>&larr; Back</button>
          <span style={S.barTitle}>{"\u{1F6E0}\uFE0F"} Assessment Design Workshop</span>
          <button style={{ ...S.btn, ...S.btnSm, ...(showEthics ? S.btnAct : S.btnG) }} onClick={() => setShowEthics(!showEthics)}>
            {"\u2696\uFE0F"} Ethics
          </button>
        </div>

        <div style={S.workshopWrap}>
          {showEthics && (
            <div style={S.ethPanel}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "#fbbf24" }}>{"\u2696\uFE0F"} Using AI Responsibly</h3>
              <div style={S.ethGrid}>
                {ETHICS_POINTS.map((p, i) => (
                  <div key={i} style={S.ethCard}>
                    <span style={{ fontSize: 22 }}>{p.icon}</span>
                    <strong style={{ fontSize: 13 }}>{p.title}</strong>
                    <p style={{ fontSize: 11, color: "#7a8ea0", margin: "4px 0 0", lineHeight: 1.5 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 1</div>
            <h2 style={S.secTitle}>Tell us about your lesson</h2>
            <p style={S.secDesc}>This info auto-fills into the prompt templates below.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={S.fld}>
                <label style={S.lbl}>Lesson / Topic Title</label>
                <input style={S.inp} placeholder="e.g. Introduction to Electrical Circuits"
                  value={lessonInfo.title} onChange={e => setLessonInfo(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={S.fld}>
                <label style={S.lbl}>Learning Outcomes (one per line)</label>
                <textarea style={S.txa} rows={4}
                  placeholder={"e.g.\nIdentify series and parallel circuits\nCalculate resistance using Ohm's law"}
                  value={lessonInfo.outcomes} onChange={e => setLessonInfo(p => ({ ...p, outcomes: e.target.value }))} />
              </div>
              <div style={S.fld}>
                <label style={S.lbl}>Current Assessment Method</label>
                <input style={S.inp} placeholder="e.g. End-of-unit written test"
                  value={lessonInfo.methods} onChange={e => setLessonInfo(p => ({ ...p, methods: e.target.value }))} />
              </div>
              <div style={S.fld}>
                <label style={S.lbl}>What frustrates you about current assessment? (optional)</label>
                <input style={S.inp} placeholder="e.g. Students find it boring, takes ages to mark"
                  value={lessonInfo.frustrations} onChange={e => setLessonInfo(p => ({ ...p, frustrations: e.target.value }))} />
              </div>
            </div>
            <button style={{ ...S.btn, ...S.btnP, marginTop: 14, opacity: lessonInfo.title ? 1 : 0.4 }} onClick={buildCustomPrompt}>
              {"\u{1F4CB}"} Generate & Copy My Custom Prompt
            </button>
            {generatedPrompt && (
              <div style={{ marginTop: 14 }}>
                <p style={S.copiedBanner}>{"\u2713"} Copied to clipboard &mdash; paste into Copilot</p>
                <pre style={S.codePre}>{generatedPrompt}</pre>
              </div>
            )}
          </div>

          {/* STEP 2 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 2</div>
            <h2 style={S.secTitle}>Or use a ready-made template</h2>
            <p style={S.secDesc}>Click to expand. Lesson info from Step 1 auto-fills where possible.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PROMPT_TEMPLATES.map((t, i) => (
                <div key={i} style={S.tmpl}>
                  <div style={S.tmplHead} onClick={() => setActiveTemplate(activeTemplate === i ? null : i)}>
                    <span style={{ fontSize: 20 }}>{t.icon}</span>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{t.title}</span>
                    <span style={{ fontSize: 11, color: "#556" }}>{activeTemplate === i ? "\u25B2" : "\u25BC"}</span>
                  </div>
                  {activeTemplate === i && (
                    <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                      <pre style={S.codePre}>{t.template}</pre>
                      <button style={{ ...S.btn, ...S.btnP, ...S.btnSm }} onClick={() => copyTemplate(i, t.template)}>
                        {copiedIdx === i ? "\u2713 Copied!" : "\u{1F4CB} Copy (auto-filled)"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* STEP 3 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 3</div>
            <h2 style={S.secTitle}>Open Copilot and prompt away!</h2>
            <div style={S.tipsBox}>
              <p style={S.tipLine}><strong>{"\u{1F517}"} Open Copilot:</strong> Go to <code style={S.codeInline}>copilot.microsoft.com</code> or use the sidebar in Edge</p>
              <p style={S.tipLine}><strong>{"\u{1F4CB}"} Paste your prompt:</strong> Use Step 1's custom prompt or a Step 2 template</p>
              <p style={S.tipLine}><strong>{"\u{1F504}"} Iterate:</strong> Try follow-ups like "Make it more practical" or "Add merit/distinction extension tasks"</p>
              <p style={S.tipLine}><strong>{"\u26A1"} Power moves:</strong> Ask for a mark scheme, student rubric, or self-assessment checklist alongside your assessment</p>
            </div>
          </div>

          {/* STEP 4 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 4</div>
            <h2 style={S.secTitle}>Review & Reflect</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {[
                { e: "\u2705", t: "What worked well?", d: "Did AI save you time? Suggest ideas you hadn't thought of?" },
                { e: "\u26A0\uFE0F", t: "What needed editing?", d: "Language, pitch level, factual accuracy?" },
                { e: "\u{1F504}", t: "What would you change?", d: "How would you refine your prompt next time?" },
              ].map((r, i) => (
                <div key={i} style={S.refCard}>
                  <span style={{ fontSize: 26 }}>{r.e}</span>
                  <strong style={{ fontSize: 14 }}>{r.t}</strong>
                  <p style={{ fontSize: 12, color: "#7a8ea0", margin: "4px 0 0" }}>{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// STYLES
const S = {
  page: {
    fontFamily: "'Instrument Sans', 'DM Sans', system-ui, sans-serif",
    minHeight: "100vh",
    background: "linear-gradient(155deg, #0b1017 0%, #111c2a 35%, #152236 100%)",
    color: "#dde4ed",
  },

  welcomeWrap: { maxWidth: 540, margin: "0 auto", padding: "42px 22px", textAlign: "center" },
  chipBadge: {
    display: "inline-block", padding: "3px 13px",
    background: "rgba(99,179,237,0.08)", border: "1px solid rgba(99,179,237,0.2)",
    borderRadius: 18, fontSize: 10, fontWeight: 700, letterSpacing: 2, color: "#63b3ed", marginBottom: 16,
  },
  heroTitle: {
    fontSize: 30, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.15,
    background: "linear-gradient(130deg, #e2e8f0 20%, #63b3ed 80%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: { fontSize: 15, color: "#5e7080", margin: "0 0 26px" },
  agenda: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 11, padding: "14px 18px", textAlign: "left", marginBottom: 26,
  },
  agendaRow: { display: "flex", gap: 12, alignItems: "flex-start", padding: "7px 0" },
  timePill: {
    fontSize: 11, fontWeight: 700, color: "#63b3ed",
    background: "rgba(99,179,237,0.07)", padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap", minWidth: 50, textAlign: "center",
  },
  agendaD: { fontSize: 12, color: "#5e7080", margin: "3px 0 0" },
  sep: { height: 1, background: "rgba(255,255,255,0.03)", margin: "1px 0" },
  stack: { display: "flex", flexDirection: "column", gap: 10, alignItems: "center" },
  heroInput: {
    width: "100%", maxWidth: 280, padding: "11px 14px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 9, color: "#dde4ed", fontSize: 15, outline: "none", textAlign: "center",
  },
  tog: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginTop: 6 },

  btn: { padding: "10px 20px", borderRadius: 9, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" },
  btnP: { background: "linear-gradient(135deg, #2563eb, #38bdf8)", color: "#fff" },
  btnG: { background: "rgba(255,255,255,0.04)", color: "#8899aa", border: "1px solid rgba(255,255,255,0.07)" },
  btnSm: { padding: "5px 12px", fontSize: 12 },
  btnLg: { padding: "14px 28px", fontSize: 16 },
  btnAct: { background: "rgba(99,179,237,0.12)", color: "#63b3ed", border: "1px solid rgba(99,179,237,0.25)" },

  bar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 16px", background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.04)", position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)",
  },
  back: { background: "none", border: "none", color: "#5e7080", fontSize: 13, cursor: "pointer" },
  barTitle: { fontSize: 14, fontWeight: 700 },
  barBadge: { fontSize: 11, fontWeight: 600, color: "#63b3ed", background: "rgba(99,179,237,0.08)", padding: "3px 10px", borderRadius: 8 },

  track: { height: 3, background: "rgba(255,255,255,0.03)" },
  fill: { height: "100%", background: "linear-gradient(90deg, #2563eb, #38bdf8)", transition: "width 0.5s ease", borderRadius: 2 },

  facBar: {
    background: "rgba(180,70,100,0.06)", borderBottom: "1px solid rgba(180,70,100,0.12)",
    padding: "7px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
  },
  facPill: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#e87", background: "rgba(200,80,120,0.1)", padding: "2px 9px", borderRadius: 5 },
  facReset: {
    padding: "3px 10px", borderRadius: 5, border: "1px solid rgba(239,68,68,0.2)",
    background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 11, cursor: "pointer", marginLeft: "auto",
  },

  iceWrap: { padding: "18px 16px 60px", maxWidth: 720, margin: "0 auto" },
  instr: {
    background: "rgba(99,179,237,0.04)", border: "1px solid rgba(99,179,237,0.1)",
    borderRadius: 10, padding: "12px 16px", marginBottom: 18,
  },

  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 9, marginBottom: 18,
  },
  card: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 11, padding: "14px 13px", transition: "all 0.2s", minHeight: 105,
    display: "flex", flexDirection: "column",
  },
  cardDone: { background: "rgba(74,222,128,0.03)", borderColor: "rgba(74,222,128,0.15)" },
  cardClaimed: { background: "rgba(251,191,36,0.03)", borderColor: "rgba(251,191,36,0.15)" },
  cardMine: { borderColor: "rgba(99,179,237,0.4)", boxShadow: "0 0 0 1px rgba(99,179,237,0.15)" },

  answerBox: {
    background: "rgba(99,179,237,0.04)", border: "1px solid rgba(99,179,237,0.12)",
    borderRadius: 13, padding: "20px 18px", marginBottom: 18,
  },
  answerTA: {
    width: "100%", padding: "11px 13px", background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "#dde4ed",
    fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit",
    marginBottom: 8, boxSizing: "border-box",
  },
  doneBox: {
    display: "flex", alignItems: "center", gap: 12,
    background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.12)",
    borderRadius: 11, padding: "16px 18px", marginBottom: 18,
  },

  briefBox: {
    background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 11, padding: "16px", textAlign: "left", marginBottom: 14, maxHeight: 260, overflow: "auto",
  },
  briefPre: { fontSize: 12, lineHeight: 1.7, color: "#93c5fd", whiteSpace: "pre-wrap", wordWrap: "break-word", margin: 0 },
  briefNote: {
    marginTop: 18, padding: "14px 18px", background: "rgba(251,191,36,0.05)",
    border: "1px solid rgba(251,191,36,0.1)", borderRadius: 10,
    fontSize: 13, color: "#fbbf24", lineHeight: 1.6, textAlign: "left",
  },

  workshopWrap: { padding: "16px 16px 60px", maxWidth: 640, margin: "0 auto" },
  sec: {
    marginBottom: 24, background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12, padding: "20px 18px",
  },
  stepPill: {
    display: "inline-block", padding: "2px 9px", background: "rgba(99,179,237,0.08)",
    borderRadius: 5, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: "#63b3ed", marginBottom: 8,
  },
  secTitle: { fontSize: 18, fontWeight: 700, margin: "0 0 3px" },
  secDesc: { fontSize: 13, color: "#5e7080", margin: "0 0 14px" },

  fld: { display: "flex", flexDirection: "column", gap: 4 },
  lbl: { fontSize: 11, fontWeight: 600, color: "#6b7f92", textTransform: "uppercase", letterSpacing: 0.5 },
  inp: {
    padding: "9px 12px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 7, color: "#dde4ed", fontSize: 14, outline: "none",
  },
  txa: {
    padding: "9px 12px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 7, color: "#dde4ed", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit",
  },
  copiedBanner: {
    padding: "7px 12px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)",
    borderRadius: 7, color: "#4ade80", fontSize: 13, fontWeight: 600, margin: "0 0 8px",
  },
  codePre: {
    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 8, padding: "12px", fontSize: 12, lineHeight: 1.6,
    color: "#93c5fd", whiteSpace: "pre-wrap", wordWrap: "break-word", margin: "8px 0",
  },

  tmpl: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 9, overflow: "hidden",
  },
  tmplHead: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer" },

  tipsBox: {
    background: "rgba(255,255,255,0.02)", borderRadius: 9, padding: "13px 16px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  tipLine: { fontSize: 14, lineHeight: 1.5, margin: 0, color: "#a0b4c4" },
  codeInline: { padding: "2px 6px", background: "rgba(99,179,237,0.07)", borderRadius: 4, fontSize: 13, color: "#63b3ed" },

  refCard: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: 9, padding: "14px", textAlign: "center",
  },

  ethPanel: {
    background: "rgba(251,191,36,0.03)", border: "1px solid rgba(251,191,36,0.08)",
    borderRadius: 12, padding: "16px 18px", marginBottom: 20,
  },
  ethGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 8 },
  ethCard: { background: "rgba(0,0,0,0.1)", borderRadius: 8, padding: "11px" },
};

export default App;
