import { useState, useEffect, useRef } from "react";
import {
  Dices, Wrench, MessageSquare, Scale, Printer, Clipboard, Copy, Check, CheckCircle2,
  AlertTriangle, Flag, Lightbulb, BarChart2, Link, RefreshCw, Zap,
  ChevronUp, ChevronDown, ChevronLeft,
  MousePointerClick, FileText, Globe, LayoutDashboard, FlaskConical, Video,
  Eye, Lock, Target, ClipboardCheck, ClipboardList,
  Info, HelpCircle, BookOpen, Layers, User,
} from "lucide-react";

const STORAGE_KEY = "biz-board-v2";
const FEEDBACK_KEY = "session-feedback-v1";

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

function feedbackGet() {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function feedbackAdd(entry) {
  const all = feedbackGet();
  all.push(entry);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all));
}

function feedbackClear() {
  localStorage.removeItem(FEEDBACK_KEY);
}

const FEEDBACK_FACES = [
  { emoji: "\u{1F620}", label: "Not useful", value: 1 },
  { emoji: "\u{1F615}", label: "Meh", value: 2 },
  { emoji: "\u{1F642}", label: "Good", value: 3 },
  { emoji: "\u{1F60A}", label: "Great", value: 4 },
  { emoji: "\u{1F929}", label: "Amazing!", value: 5 },
];

const RESOURCE_TYPES = [
  { id: "interactive", label: "Interactive / Digital", Icon: MousePointerClick, desc: "Drag-and-drop, clickable, auto-marked online activity" },
  { id: "paper", label: "Paper-Based", Icon: FileText, desc: "Printable worksheet, exam paper, or booklet" },
  { id: "website", label: "Website / Web App", Icon: Globe, desc: "A single self-contained HTML file I can upload to SharePoint or share directly" },
  { id: "presentation", label: "Presentation / Slides", Icon: LayoutDashboard, desc: "PowerPoint / Google Slides with embedded tasks" },
  { id: "practical", label: "Practical / Hands-On", Icon: FlaskConical, desc: "Observation checklist, lab task, or physical activity" },
  { id: "video", label: "Video-Based", Icon: Video, desc: "Video scenario with questions or a student-produced video task" },
];

const BUSINESS_QUESTIONS = [
  { id: "product", label: "The Product", question: "What does this business sell?", hint: "Be creative \u2014 products, services, experiences. The weirder the better.", placeholder: "e.g. Edible furniture for pets, time-travel insurance...", emoji: "\u{1F6CD}\uFE0F" },
  { id: "customer", label: "Target Customer", question: "Who is the ideal (unlikely) customer?", hint: "Think of the most unexpected demographic.", placeholder: "e.g. Retired astronauts, anxious cats, medieval re-enactors...", emoji: "\u{1F3AF}" },
  { id: "name", label: "Business Name", question: "What is the business called?", hint: "Make it memorable. Puns welcome.", placeholder: "e.g. Chairish the Moment, Paws & Effect...", emoji: "\u2728" },
  { id: "slogan", label: "The Slogan", question: "What\u2019s the company slogan?", hint: "Channel your inner Mad Men. Keep it punchy.", placeholder: "e.g. \u2018Because gravity is optional\u2019...", emoji: "\u{1F4E3}" },
  { id: "origin", label: "Origin Story", question: "How did the founder come up with this idea?", hint: "The stranger the origin story, the better.", placeholder: "e.g. Fell asleep in IKEA and had a vision...", emoji: "\u{1F4A1}" },
  { id: "disaster", label: "Year One Disaster", question: "What went spectacularly wrong in year one?", hint: "Every great business has a crisis. What was theirs?", placeholder: "e.g. The CEO turned out to be three raccoons in a trenchcoat...", emoji: "\u{1F4A5}" },
  { id: "pivot", label: "The Pivot", question: "How did they heroically recover?", hint: "Out of disaster comes innovation.", placeholder: "e.g. Partnered with NASA, went underground (literally)...", emoji: "\u{1F680}" },
  { id: "feature", label: "Killer Feature", question: "What\u2019s the one feature that makes this product irresistible?", hint: "The thing competitors can\u2019t replicate.", placeholder: "e.g. It glows in the dark, it reads your mood...", emoji: "\u26A1" },
  { id: "testimonial", label: "Customer Testimonial", question: "Write a fake 5-star customer review.", hint: "Be dramatic. Be emotional. Be ridiculous.", placeholder: "e.g. \u2018This product saved my marriage AND my souffl\u00E9. 10/10\u2019...", emoji: "\u2B50" },
  { id: "future", label: "Future Vision", question: "Where is this business in 10 years?", hint: "Dream big. World domination? Space expansion? IPO on Mars?", placeholder: "e.g. Franchises on every continent including Antarctica...", emoji: "\u{1F52E}" },
];

const ETHICS_POINTS = [
  { Icon: Eye, title: "Always Review", desc: "AI output is a first draft, never a final product. Check for accuracy, bias, and relevance to YOUR students." },
  { Icon: Scale, title: "Bias Awareness", desc: "AI can reflect societal biases. Review for inclusive language, diverse examples, and cultural sensitivity." },
  { Icon: Lock, title: "Data Privacy", desc: "Never paste student names, data, or sensitive info into AI tools. Keep prompts anonymous." },
  { Icon: Target, title: "Pedagogical Judgement", desc: "You know your students. AI doesn\u2019t. Always adapt outputs to your class context and individual needs." },
  { Icon: ClipboardCheck, title: "Quality Assurance", desc: "Cross-check AI-generated answers and marking criteria against your subject expertise and awarding body standards." },
  { Icon: Lightbulb, title: "Transparency", desc: "Be open with colleagues about AI use. Share what works. Build a culture of ethical experimentation." },
];

// ============ PROMPT TEMPLATE BUILDER ============
// Each template is a function that takes lessonInfo and returns the fully-filled prompt string.
// This ensures ALL user inputs are injected, not just title/outcomes.

function formatOutcomes(raw) {
  if (!raw) return "- [Add your learning outcomes]";
  return raw.split("\n").filter(Boolean).map(o => `- ${o.trim()}`).join("\n");
}

function resourceDesc(type) {
  const r = RESOURCE_TYPES.find(t => t.id === type);
  return r ? r.label : "a resource";
}

function resourceFormatInstructions(type) {
  switch (type) {
    case "interactive": return `FORMAT & DELIVERY:
- This must be a fully interactive digital activity (e.g. for use in a browser, LMS/VLE, or tool like Nearpod/Kahoot/Google Forms).
- Include drag-and-drop, click-to-reveal, or auto-scored question types where possible.
- Provide the content in a format I can directly paste into a digital tool, OR provide complete HTML/CSS/JS code I can host as a standalone page.
- Include clear instructions for the student at the top.`;
    case "paper": return `FORMAT & DELIVERY:
- This must be a clean, print-ready document.
- Use clear headings, numbered questions, and adequate white space for student answers.
- Include a header with: Assessment Title, Student Name, Date, and Total Marks.
- Include a footer with page numbers.
- Provide the output in a format ready to paste into Word or Google Docs for printing.`;
    case "website": return `FORMAT & DELIVERY:
- Produce this as a SINGLE, SELF-CONTAINED HTML file. Everything (CSS, JavaScript, images as data URIs) must be embedded in one .html file with NO external dependencies, CDN links, or separate files.
- I need to be able to save this as one .html file, upload it to SharePoint, and have it work immediately when opened in a browser.
- The page should be visually polished, mobile-responsive, and professional.
- Include interactive elements where appropriate (expandable sections, buttons, hover effects, auto-marking).
- Include a clear title, student instructions, and navigation.
- Do NOT use any framework or library that requires a build step. Use only vanilla HTML, CSS, and JavaScript.`;
    case "presentation": return `FORMAT & DELIVERY:
- Structure this as a slide-by-slide outline I can build in PowerPoint or Google Slides.
- Each slide should have: a title, the task/question, and presenter notes with expected answers.
- Include a title slide, instruction slide, one slide per question/task, and a summary/reflection slide.
- Suggest images or visual layouts for key slides.`;
    case "practical": return `FORMAT & DELIVERY:
- Create a practical observation checklist and task brief.
- The task brief should include: aim, equipment/materials needed, step-by-step instructions, safety notes.
- The observation checklist should have: skill/criteria rows, columns for "Not Yet / Developing / Competent / Excellent", and an assessor notes column.
- Format everything as a printable table.`;
    case "video": return `FORMAT & DELIVERY:
- Design this as a video-based assessment task.
- Option A: Provide a scenario script/storyboard for a video I\u2019ll show students, with comprehension/analysis questions.
- Option B: Provide a student video production brief with clear success criteria.
- Include timing guidance and any required resources.`;
    default: return "";
  }
}

const PROMPT_TEMPLATES = [
  {
    title: "Quick Quiz Generator",
    Icon: HelpCircle,
    build: (info) => `I teach a lesson called "${info.title || "[LESSON TITLE]"}".

LEARNING OUTCOMES students must demonstrate:
${formatOutcomes(info.outcomes)}

${info.methods ? `I currently assess this using: ${info.methods}` : ""}
${info.frustrations ? `My frustration with current assessment: ${info.frustrations}` : ""}

TASK: Create a 10-question quiz delivered as ${resourceDesc(info.resourceType)}.

REQUIREMENTS:
- Mix question types: multiple choice, true/false, short answer, and one extended response
- Progress from simple recall \u2192 understanding \u2192 application \u2192 analysis
- Each question MUST map to a specific learning outcome (state which one)
- Include detailed feedback for EVERY wrong answer option explaining WHY it\u2019s wrong
- Include a complete answer key with mark allocation
- Total: 30 marks

${resourceFormatInstructions(info.resourceType)}

Also provide a separate MARKING GUIDE with acceptable alternative answers.`
  },
  {
    title: "Scenario-Based Assessment",
    Icon: BookOpen,
    build: (info) => `I teach a lesson called "${info.title || "[LESSON TITLE]"}".

LEARNING OUTCOMES students must demonstrate:
${formatOutcomes(info.outcomes)}

${info.methods ? `Current assessment method: ${info.methods}` : ""}
${info.frustrations ? `What I want to improve: ${info.frustrations}` : ""}

TASK: Create a scenario-based assessment delivered as ${resourceDesc(info.resourceType)}.

REQUIREMENTS:
- Write a realistic, engaging real-world or workplace scenario (at least 150 words)
- Students must: (1) Identify the key problem/issue, (2) Apply their knowledge to propose a solution, (3) Justify their decisions with reasoning linked to the learning outcomes
- Include 4\u20136 structured questions that progress through Bloom\u2019s taxonomy
- Provide a full MARKING RUBRIC with criteria at:
  \u2022 Pass: Basic identification and description
  \u2022 Merit: Clear application with some analysis
  \u2022 Distinction: Detailed evaluation with justified conclusions
- Include model answers at each grade boundary

${resourceFormatInstructions(info.resourceType)}`
  },
  {
    title: "Differentiated Assessment Pack",
    Icon: Layers,
    build: (info) => `I teach a lesson called "${info.title || "[LESSON TITLE]"}".

LEARNING OUTCOMES (all three versions must assess THESE SAME outcomes):
${formatOutcomes(info.outcomes)}

${info.methods ? `Current assessment method: ${info.methods}` : ""}
${info.frustrations ? `What I want to improve: ${info.frustrations}` : ""}

TASK: Create THREE differentiated versions of an assessment, all delivered as ${resourceDesc(info.resourceType)}.

VERSION 1 \u2014 FOUNDATION (lower ability / additional support):
- Scaffolded questions with sentence starters, word banks, and visual prompts
- Fill-in-the-gap and matching exercises
- Simplified language, shorter responses expected

VERSION 2 \u2014 INTERMEDIATE (middle ability):
- Open-ended questions requiring explanation in own words
- Some application and comparison tasks
- No scaffolding but clear question structure

VERSION 3 \u2014 ADVANCED (higher ability / stretch & challenge):
- Extended response questions requiring analysis, evaluation, and synthesis
- Require students to make and defend judgements
- Include an unseen element or unfamiliar context

ALL VERSIONS MUST:
- Assess the same learning outcomes (state which outcome each question targets)
- Include a complete answer guide with mark scheme
- Be clearly labelled so I can distribute the right version to each student

${resourceFormatInstructions(info.resourceType)}`
  },
  {
    title: "Practical Skills Checklist",
    Icon: ClipboardList,
    build: (info) => `I teach a lesson called "${info.title || "[LESSON TITLE]"}".

LEARNING OUTCOMES / SKILLS students must demonstrate:
${formatOutcomes(info.outcomes)}

${info.methods ? `Current assessment method: ${info.methods}` : ""}
${info.frustrations ? `What I want to improve: ${info.frustrations}` : ""}

TASK: Create a practical skills observation checklist and task brief, delivered as ${resourceDesc(info.resourceType)}.

THE TASK BRIEF should include:
- Clear aim / learning objective
- Equipment and materials list
- Step-by-step procedure (numbered)
- Health & safety requirements
- Time allocation
- Expected outcome / what a successful result looks like

THE OBSERVATION CHECKLIST should include:
- Each skill broken into specific, observable sub-steps
- Assessment columns: "Not Yet | Developing | Competent | Excellent"
- Space for assessor written notes per skill
- A final holistic grade row
- Health & safety compliance row

${resourceFormatInstructions(info.resourceType)}

Also include a STUDENT SELF-ASSESSMENT version of the checklist they can complete before/after the task.`
  },
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
  const [lessonInfo, setLessonInfo] = useState({
    title: "", outcomes: "", methods: "", frustrations: "", resourceType: "",
  });
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [showEthics, setShowEthics] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [printContent, setPrintContent] = useState("");

  // Feedback
  const [feedbackData, setFeedbackData] = useState([]);
  const [myFeedback, setMyFeedback] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const feedbackPollRef = useRef(null);

  // Storage
  const loadBoard = () => { setBoardData(storageGet()); };
  const saveBoard = (d) => { storageSet(d); setBoardData(d); };

  const claimQuestion = (qId) => {
    if (myClaimedId || mySubmitted) return;
    let c = { ...boardData };
    if (c[qId]) return;
    c[qId] = { name: userName, answer: null, time: Date.now() };
    setMyClaimedId(qId);
    saveBoard(c);
  };

  const submitAnswer = () => {
    if (!answerInput.trim() || !myClaimedId) return;
    let c = { ...boardData };
    c[myClaimedId] = { ...c[myClaimedId], answer: answerInput.trim(), time: Date.now() };
    saveBoard(c);
    setMySubmitted(true);
    setAnswerInput("");
  };

  const resetBoard = () => { storageClear(); setBoardData({}); setMyClaimedId(null); setMySubmitted(false); };

  // Feedback helpers
  const loadFeedback = () => { setFeedbackData(feedbackGet()); };

  const submitFeedback = (value) => {
    if (feedbackSubmitted) return;
    const face = FEEDBACK_FACES.find(f => f.value === value);
    feedbackAdd({ name: userName, value, label: face?.label, time: Date.now() });
    setMyFeedback(value);
    setFeedbackSubmitted(true);
    loadFeedback();
  };

  const resetFeedback = () => { feedbackClear(); setFeedbackData([]); setMyFeedback(null); setFeedbackSubmitted(false); };

  useEffect(() => {
    if (view === "feedback") {
      loadFeedback();
      // Check if this user already submitted
      const existing = feedbackGet().find(f => f.name === userName);
      if (existing) { setMyFeedback(existing.value); setFeedbackSubmitted(true); }
      feedbackPollRef.current = setInterval(loadFeedback, 3000);
      return () => clearInterval(feedbackPollRef.current);
    }
  }, [view]);

  useEffect(() => {
    if (view === "icebreaker") { loadBoard(); pollRef.current = setInterval(loadBoard, 3000); return () => clearInterval(pollRef.current); }
  }, [view]);

  useEffect(() => {
    if (view === "icebreaker" && userName && Object.keys(boardData).length > 0) {
      const myEntry = Object.entries(boardData).find(([_, v]) => v.name === userName);
      if (myEntry) { setMyClaimedId(myEntry[0]); if (myEntry[1].answer) setMySubmitted(true); }
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

  const copyBrief = () => { navigator.clipboard.writeText(buildBrief()); setBriefCopied(true); setTimeout(() => setBriefCopied(false), 3000); };

  // Build and copy a template prompt with ALL user info prefilled
  const copyTemplate = (idx) => {
    const prompt = PROMPT_TEMPLATES[idx].build(lessonInfo);
    navigator.clipboard.writeText(prompt);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Build custom prompt (Step 1)
  const buildCustomPrompt = () => {
    if (!lessonInfo.title) return;
    const rt = lessonInfo.resourceType ? resourceDesc(lessonInfo.resourceType) : "any suitable format";
    const prompt = `I teach a lesson called "${lessonInfo.title}".

LEARNING OUTCOMES students must demonstrate:
${formatOutcomes(lessonInfo.outcomes)}

${lessonInfo.methods ? `I currently assess this using: ${lessonInfo.methods}` : ""}
${lessonInfo.frustrations ? `My main frustration with current assessment: ${lessonInfo.frustrations}` : ""}

DESIRED RESOURCE TYPE: ${rt}

Please design a complete, ready-to-use assessment resource that:
- Aligns EVERY question/task directly to one or more of the learning outcomes above
- Is practical and achievable within a single classroom session
- Includes clear success criteria or a detailed marking guide with mark allocations
- Engages students more than a standard written test
- Includes model answers or expected responses

${lessonInfo.resourceType ? resourceFormatInstructions(lessonInfo.resourceType) : ""}

Provide the complete resource ready for me to use, not just suggestions.`;
    setGeneratedPrompt(prompt);
    navigator.clipboard.writeText(prompt);
  };

  // Print view
  const openPrintView = (content) => {
    setPrintContent(content);
    setShowPrint(true);
  };

  const handlePrint = () => { window.print(); };

  // ===== PRINT VIEW =====
  if (showPrint) {
    return (
      <div>
        <style>{`
          @media screen {
            .print-toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 20px;
              background: #111; border-bottom: 1px solid #333; position: sticky; top: 0; z-index: 10; }
            .print-body { max-width: 800px; margin: 0 auto; padding: 30px 24px; background: #fff; color: #222;
              font-family: Georgia, 'Times New Roman', serif; font-size: 14px; line-height: 1.8; min-height: 100vh; }
          }
          @media print {
            .print-toolbar { display: none !important; }
            .print-body { padding: 0; margin: 0; max-width: 100%; }
            body { background: #fff !important; }
          }
        `}</style>
        <div className="print-toolbar">
          <button style={{ ...S.btn, ...S.btnG, display: "flex", alignItems: "center", gap: 6 }} onClick={() => setShowPrint(false)}><ChevronLeft size={14} /> Back to Workshop</button>
          <button style={{ ...S.btn, ...S.btnP, display: "flex", alignItems: "center", gap: 7 }} onClick={handlePrint}><Printer size={15} /> Print / Save as PDF</button>
          <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>Tip: Use &ldquo;Save as PDF&rdquo; in the print dialog for a digital copy</span>
        </div>
        <div className="print-body">
          <h1 style={{ fontSize: 22, marginBottom: 4, borderBottom: "2px solid #222", paddingBottom: 8 }}>Assessment Resource</h1>
          <p style={{ fontSize: 12, color: "#666", marginBottom: 20 }}>
            Lesson: <strong>{lessonInfo.title || "Untitled"}</strong>
            {lessonInfo.resourceType && <> &bull; Format: <strong>{resourceDesc(lessonInfo.resourceType)}</strong></>}
          </p>
          <hr style={{ border: "none", borderTop: "1px solid #ddd", margin: "0 0 20px" }} />
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", fontFamily: "inherit", fontSize: 13, lineHeight: 1.7 }}>
            {printContent}
          </pre>
          <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid #ddd", fontSize: 11, color: "#999" }}>
            Generated with AI-Powered Assessment Design Workshop &bull; Always review AI output before use with students
          </div>
        </div>
      </div>
    );
  }

  // ===== NAME ENTRY (full-screen gate) =====
  if (!nameSet) {
    return (
      <div style={S.page}>
        <div style={S.nameGate}>
          <div style={S.chipBadge}>CPD SESSION</div>
          <h1 style={S.heroTitle}>AI-Powered<br/>Assessment Design</h1>
          <p style={S.heroSub}>A 50-minute interactive workshop</p>

          <div style={S.nameBox}>
            <User size={36} style={{ color: "#63b3ed", opacity: 0.8 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "4px 0 2px" }}>What&apos;s your first name?</h2>
            <p style={{ fontSize: 13, color: "#5e7080", margin: "0 0 16px" }}>We need this so your responses show up on the board.</p>
            <input style={{ ...S.heroInput, maxWidth: 320, fontSize: 18, padding: "14px 16px" }}
              placeholder="Type your name..."
              value={userName} onChange={e => setUserName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && userName.trim() && setNameSet(true)}
              autoFocus />
            <button style={{ ...S.btn, ...S.btnP, ...S.btnLg, marginTop: 8, opacity: userName.trim() ? 1 : 0.4 }}
              onClick={() => userName.trim() && setNameSet(true)}>
              Let&apos;s Go &rarr;
            </button>
          </div>

          <button style={S.skipBtn} onClick={() => { setUserName("Facilitator"); setNameSet(true); setFacilitatorMode(true); }}>
            Skip &mdash; I&apos;m the facilitator
          </button>
        </div>
      </div>
    );
  }

  // ===== WELCOME (main nav, only shown after name entered) =====
  if (view === "welcome") {
    return (
      <div style={S.page}>
        <div style={S.welcomeWrap}>
          <div style={S.chipBadge}>CPD SESSION</div>
          <h1 style={S.heroTitle}>AI-Powered<br/>Assessment Design</h1>
          <p style={{ color: "#6b7f92", margin: "0 0 20px", fontSize: 15 }}>
            Welcome, <strong style={{ color: "#dde4ed" }}>{userName}</strong>!
          </p>
          <div style={S.agenda}>
            {[
              { t: "12 min", Icon: Dices, l: "The Worst Best Business", d: "Claim a question, build a ridiculous startup together" },
              { t: "33 min", Icon: Wrench, l: "Assessment Design Workshop", d: "Use Copilot to design a real assessment for your lesson" },
              { t: "5 min", Icon: Scale, l: "Ethics & Takeaways", d: "Responsible AI use \u2014 what to watch for" },
            ].map((a, i) => (
              <div key={i}>
                {i > 0 && <div style={S.sep} />}
                <div style={S.agendaRow}>
                  <span style={S.timePill}>{a.t}</span>
                  <div><strong style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}><a.Icon size={13} style={{ opacity: 0.7 }} /> {a.l}</strong><p style={S.agendaD}>{a.d}</p></div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.stack}>
            <button style={{ ...S.btn, ...S.btnP, display: "flex", alignItems: "center", gap: 8 }} onClick={() => setView("icebreaker")}><Dices size={16} /> Start Icebreaker</button>
            <button style={{ ...S.btn, ...S.btnG, display: "flex", alignItems: "center", gap: 8 }} onClick={() => setView("workshop")}><Wrench size={16} /> Jump to Workshop</button>
            <button style={{ ...S.btn, ...S.btnG, display: "flex", alignItems: "center", gap: 8 }} onClick={() => setView("feedback")}><MessageSquare size={16} /> Session Feedback</button>
            {facilitatorMode && (
              <span style={{ fontSize: 11, color: "#e87", marginTop: 4 }}>Facilitator mode active</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== ICEBREAKER =====
  if (view === "icebreaker") {
    if (!nameSet) { setView("welcome"); return null; }
    const getStatus = (qId) => { const e = boardData[qId]; if (!e) return "open"; if (e.answer) return "done"; return "claimed"; };
    const myQ = myClaimedId ? BUSINESS_QUESTIONS.find(q => q.id === myClaimedId) : null;

    return (
      <div style={S.page}>
        <div style={S.bar}>
          <button style={{ ...S.back, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setView("welcome")}><ChevronLeft size={15} /> Back</button>
          <span style={{ ...S.barTitle, display: "flex", alignItems: "center", gap: 6 }}><Dices size={16} /> The Worst Best Business</span>
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
                Once you claim it, write your answer. Together you&apos;ll build the most ridiculous startup ever.
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
                <div key={q.id} onClick={() => canClaim && claimQuestion(q.id)}
                  style={{ ...S.card, ...(status === "done" ? S.cardDone : {}), ...(status === "claimed" ? S.cardClaimed : {}), ...(isMine && !mySubmitted ? S.cardMine : {}), cursor: canClaim ? "pointer" : "default" }}
                  onMouseEnter={e => { if (canClaim) e.currentTarget.style.borderColor = "rgba(99,179,237,0.4)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = status === "done" ? "rgba(74,222,128,0.15)" : status === "claimed" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.07)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 24 }}>{q.emoji}</span>
                    <span style={{ width: 9, height: 9, borderRadius: "50%",
                      background: status === "done" ? "#4ade80" : status === "claimed" ? "#fbbf24" : "rgba(255,255,255,0.12)",
                      boxShadow: status === "done" ? "0 0 6px rgba(74,222,128,0.4)" : status === "claimed" ? "0 0 6px rgba(251,191,36,0.3)" : "none" }} />
                  </div>
                  <strong style={{ fontSize: 13, color: "#c0cdd8", display: "block", marginBottom: 4 }}>{q.label}</strong>
                  {status === "done" && entry && (<><p style={{ fontSize: 12, fontStyle: "italic", color: "#7a9aaa", margin: "2px 0 4px", lineHeight: 1.4 }}>&ldquo;{entry.answer}&rdquo;</p><span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>&mdash; {entry.name}</span></>)}
                  {status === "claimed" && !entry?.answer && (<p style={{ fontSize: 12, color: "#fbbf24", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>{isMine ? <><Pencil size={11} /> You claimed this!</> : <><Clock size={11} /> {entry?.name} is writing...</>}</p>)}
                  {status === "open" && canClaim && (<p style={{ fontSize: 11, color: "#4a6070", margin: "auto 0 0", paddingTop: 4 }}>Click to claim</p>)}
                  {status === "open" && !canClaim && (<p style={{ fontSize: 11, color: "#334050", margin: "auto 0 0", fontStyle: "italic", paddingTop: 4 }}>Available</p>)}
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
              <textarea style={S.answerTA} placeholder={myQ.placeholder} value={answerInput}
                onChange={e => setAnswerInput(e.target.value)} rows={3} maxLength={200} autoFocus />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#445566" }}>{answerInput.length}/200</span>
                <button style={{ ...S.btn, ...S.btnP, opacity: answerInput.trim() ? 1 : 0.4 }} onClick={submitAnswer}>Submit Answer &check;</button>
              </div>
            </div>
          )}

          {mySubmitted && !allComplete && (
            <div style={S.doneBox}>
              <CheckCircle2 size={26} style={{ color: "#4ade80", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 15 }}><strong>You&apos;re in!</strong> Your answer is on the board. Watch the others fill in the gaps...</p>
            </div>
          )}

          {allComplete && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><Flag size={22} /> The business is complete!</h2>
              <p style={{ color: "#7a8ea0", fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>Every question answered. Copy the brief below and paste it into Claude to generate a website live.</p>
              <div style={S.briefBox}><pre style={S.briefPre}>{buildBrief()}</pre></div>
              <button style={{ ...S.btn, ...S.btnP, ...S.btnLg, marginTop: 4, display: "flex", alignItems: "center", gap: 8, margin: "4px auto 0" }} onClick={copyBrief}>
                {briefCopied ? <><Check size={16} /> Copied to clipboard!</> : <><Clipboard size={16} /> Copy Brief to Clipboard</>}
              </button>
              <div style={S.briefNote}>
                <strong style={{ display: "flex", alignItems: "center", gap: 6 }}><Lightbulb size={14} /> What just happened:</strong> Each of you contributed one piece of creative input. Now AI will synthesise it
                into a structured website &mdash; messy human creativity &rarr; polished output. That&apos;s exactly the skill you&apos;ll use next to design assessments with Copilot.
              </div>
              <button style={{ ...S.btn, ...S.btnG, marginTop: 14 }} onClick={() => setView("workshop")}>Continue to Workshop &rarr;</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== WORKSHOP =====
  if (view === "workshop") {
    if (!nameSet) { setView("welcome"); return null; }
    const readyForTemplates = lessonInfo.title && lessonInfo.outcomes && lessonInfo.resourceType;

    return (
      <div style={S.page}>
        <div style={S.bar}>
          <button style={{ ...S.back, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setView("welcome")}><ChevronLeft size={15} /> Back</button>
          <span style={{ ...S.barTitle, display: "flex", alignItems: "center", gap: 6 }}><Wrench size={16} /> Assessment Design Workshop</span>
          <button style={{ ...S.btn, ...S.btnSm, ...(showEthics ? S.btnAct : S.btnG), display: "flex", alignItems: "center", gap: 5 }} onClick={() => setShowEthics(!showEthics)}>
            <Scale size={13} /> Ethics
          </button>
        </div>

        <div style={S.workshopWrap}>
          {showEthics && (
            <div style={S.ethPanel}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "#fbbf24", display: "flex", alignItems: "center", gap: 8 }}><Scale size={16} style={{ opacity: 0.8 }} /> Using AI Responsibly</h3>
              <div style={S.ethGrid}>
                {ETHICS_POINTS.map((p, i) => (
                  <div key={i} style={S.ethCard}>
                    <p.Icon size={20} style={{ color: "#63b3ed", marginBottom: 4 }} />
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
            <p style={S.secDesc}>This info auto-fills into every prompt in Step 2.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={S.fld}>
                <label style={S.lbl}>Lesson / Topic Title *</label>
                <input style={S.inp} placeholder="e.g. Introduction to Electrical Circuits"
                  value={lessonInfo.title} onChange={e => setLessonInfo(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div style={S.fld}>
                <label style={S.lbl}>Learning Outcomes (one per line) *</label>
                <textarea style={S.txa} rows={4}
                  placeholder={"e.g.\nIdentify series and parallel circuits\nCalculate resistance using Ohm\u2019s law"}
                  value={lessonInfo.outcomes} onChange={e => setLessonInfo(p => ({ ...p, outcomes: e.target.value }))} />
              </div>

              {/* RESOURCE TYPE PICKER */}
              <div style={S.fld}>
                <label style={S.lbl}>What type of resource do you want? *</label>
                <div style={S.rtGrid}>
                  {RESOURCE_TYPES.map(rt => {
                    const active = lessonInfo.resourceType === rt.id;
                    return (
                      <div key={rt.id}
                        onClick={() => setLessonInfo(p => ({ ...p, resourceType: rt.id }))}
                        style={{ ...S.rtCard, ...(active ? S.rtCardActive : {}) }}>
                        <rt.Icon size={20} style={{ color: active ? "#63b3ed" : "#7a8ea0", marginBottom: 2 }} />
                        <strong style={{ fontSize: 12, color: active ? "#63b3ed" : "#c0cdd8" }}>{rt.label}</strong>
                        <p style={{ fontSize: 10, color: "#5e7080", margin: "2px 0 0", lineHeight: 1.4 }}>{rt.desc}</p>
                      </div>
                    );
                  })}
                </div>
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

            {/* Summary of what Step 1 captured */}
            {lessonInfo.title && (
              <div style={S.summaryBox}>
                <strong style={{ fontSize: 12, color: "#63b3ed", display: "flex", alignItems: "center", gap: 5 }}><Info size={12} /> Your info will be injected into every template below:</strong>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#8aa", lineHeight: 1.6 }}>
                  <li><strong>Topic:</strong> {lessonInfo.title}</li>
                  {lessonInfo.outcomes && <li><strong>Outcomes:</strong> {lessonInfo.outcomes.split("\n").filter(Boolean).length} learning outcome(s)</li>}
                  {lessonInfo.resourceType && <li><strong>Format:</strong> {resourceDesc(lessonInfo.resourceType)}</li>}
                  {lessonInfo.methods && <li><strong>Current method:</strong> {lessonInfo.methods}</li>}
                  {lessonInfo.frustrations && <li><strong>Frustration:</strong> {lessonInfo.frustrations}</li>}
                </ul>
              </div>
            )}

            <button style={{ ...S.btn, ...S.btnP, marginTop: 14, display: "flex", alignItems: "center", gap: 8, opacity: (lessonInfo.title && lessonInfo.resourceType) ? 1 : 0.4 }} onClick={buildCustomPrompt}>
              <Copy size={15} /> Generate & Copy My Custom Prompt
            </button>

            {generatedPrompt && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <p style={{ ...S.copiedBanner, display: "flex", alignItems: "center", gap: 6 }}><Check size={14} /> Copied to clipboard &mdash; paste into Copilot</p>
                  <button style={{ ...S.btn, ...S.btnSm, ...S.btnG, display: "flex", alignItems: "center", gap: 5 }} onClick={() => openPrintView(generatedPrompt)}><Printer size={13} /> Print</button>
                </div>
                <pre style={S.codePre}>{generatedPrompt}</pre>
              </div>
            )}
          </div>

          {/* STEP 2 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 2</div>
            <h2 style={S.secTitle}>Or use a ready-made template</h2>
            <p style={S.secDesc}>
              {readyForTemplates
                ? <>Your lesson info is pre-filled into each template. Click to preview, then copy.</>
                : <><AlertTriangle size={13} style={{ color: "#fbbf24", verticalAlign: "middle" }} /> <span style={{ color: "#fbbf24" }}>Fill in Step 1 first</span> (at least title, outcomes, and resource type) so the templates are pre-filled with your info.</>
              }
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PROMPT_TEMPLATES.map((t, i) => {
                const filled = t.build(lessonInfo);
                return (
                  <div key={i} style={S.tmpl}>
                    <div style={S.tmplHead} onClick={() => setActiveTemplate(activeTemplate === i ? null : i)}>
                      <t.Icon size={18} style={{ color: "#63b3ed", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{t.title}</span>
                      {readyForTemplates && <span style={{ fontSize: 10, color: "#4ade80", display: "flex", alignItems: "center", gap: 3, marginRight: 6 }}><Check size={10} /> Pre-filled</span>}
                      {activeTemplate === i ? <ChevronUp size={14} style={{ color: "#556" }} /> : <ChevronDown size={14} style={{ color: "#556" }} />}
                    </div>
                    {activeTemplate === i && (
                      <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <pre style={S.codePre}>{filled}</pre>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ ...S.btn, ...S.btnP, ...S.btnSm, display: "flex", alignItems: "center", gap: 5 }} onClick={() => copyTemplate(i)}>
                            {copiedIdx === i ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Prompt</>}
                          </button>
                          <button style={{ ...S.btn, ...S.btnSm, ...S.btnG, display: "flex", alignItems: "center", gap: 5 }} onClick={() => openPrintView(filled)}>
                            <Printer size={13} /> Print
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 3</div>
            <h2 style={S.secTitle}>Open Copilot and prompt away!</h2>
            <div style={S.tipsBox}>
              <p style={S.tipLine}><strong style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Link size={14} /> Open Copilot:</strong> Go to <code style={S.codeInline}>copilot.microsoft.com</code> or use the sidebar in Edge</p>
              <p style={S.tipLine}><strong style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Clipboard size={14} /> Paste your prompt:</strong> Use Step 1&apos;s custom prompt or a Step 2 template</p>
              <p style={S.tipLine}><strong style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={14} /> Iterate:</strong> Try follow-ups like &ldquo;Make it more practical&rdquo; or &ldquo;Add merit/distinction extension tasks&rdquo;</p>
              <p style={S.tipLine}><strong style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Zap size={14} /> Power moves:</strong> Ask for a mark scheme, student rubric, or self-assessment checklist alongside your assessment</p>
            </div>
          </div>

          {/* STEP 4 */}
          <div style={S.sec}>
            <div style={S.stepPill}>STEP 4</div>
            <h2 style={S.secTitle}>Review & Reflect</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
              {[
                { Icon: CheckCircle2, t: "What worked well?", d: "Did AI save you time? Suggest ideas you hadn\u2019t thought of?" },
                { Icon: AlertTriangle, t: "What needed editing?", d: "Language, pitch level, factual accuracy?" },
                { Icon: RefreshCw, t: "What would you change?", d: "How would you refine your prompt next time?" },
              ].map((r, i) => (
                <div key={i} style={S.refCard}>
                  <r.Icon size={26} style={{ color: "#63b3ed", margin: "0 auto 6px" }} />
                  <strong style={{ fontSize: 14 }}>{r.t}</strong>
                  <p style={{ fontSize: 12, color: "#7a8ea0", margin: "4px 0 0" }}>{r.d}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button style={{ ...S.btn, ...S.btnP, display: "flex", alignItems: "center", gap: 8, margin: "0 auto" }} onClick={() => setView("feedback")}>
                <MessageSquare size={15} /> Give Session Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== FEEDBACK =====
  if (view === "feedback") {
    if (!nameSet) { setView("welcome"); return null; }
    const avgScore = feedbackData.length > 0
      ? (feedbackData.reduce((s, f) => s + f.value, 0) / feedbackData.length).toFixed(1)
      : null;

    const countByValue = FEEDBACK_FACES.map(f => ({
      ...f,
      count: feedbackData.filter(d => d.value === f.value).length,
    }));

    const maxCount = Math.max(...countByValue.map(c => c.count), 1);

    return (
      <div style={S.page}>
        <div style={S.bar}>
          <button style={{ ...S.back, display: "flex", alignItems: "center", gap: 4 }} onClick={() => setView("workshop")}><ChevronLeft size={15} /> Back</button>
          <span style={{ ...S.barTitle, display: "flex", alignItems: "center", gap: 6 }}><MessageSquare size={16} /> Session Feedback</span>
          <span style={S.barBadge}>{feedbackData.length} response{feedbackData.length !== 1 ? "s" : ""}</span>
        </div>

        <div style={S.feedbackWrap}>
          {/* Submit feedback */}
          {!feedbackSubmitted ? (
            <div style={S.feedbackCard}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px", textAlign: "center" }}>How was this session for you?</h2>
              <p style={{ fontSize: 13, color: "#5e7080", margin: "0 0 20px", textAlign: "center" }}>Tap a face to share your honest feedback.</p>
              <div style={S.faceRow}>
                {FEEDBACK_FACES.map(f => (
                  <div key={f.value} onClick={() => submitFeedback(f.value)} style={S.faceBtn}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.2)"; e.currentTarget.style.background = "rgba(99,179,237,0.1)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
                    <span style={{ fontSize: 40 }}>{f.emoji}</span>
                    <span style={{ fontSize: 11, color: "#7a8ea0", marginTop: 4 }}>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={S.feedbackCard}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 48 }}>{FEEDBACK_FACES.find(f => f.value === myFeedback)?.emoji}</span>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 4px" }}>Thanks, {userName}!</h2>
                <p style={{ fontSize: 13, color: "#5e7080", margin: 0 }}>Your feedback has been recorded.</p>
              </div>
            </div>
          )}

          {/* Live results (always visible, updates via polling) */}
          {feedbackData.length > 0 && (
            <div style={S.feedbackResults}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 7 }}>
                <BarChart2 size={16} /> Live Results
                <span style={{ fontSize: 12, fontWeight: 400, color: "#5e7080", marginLeft: 8 }}>
                  {feedbackData.length} response{feedbackData.length !== 1 ? "s" : ""}{avgScore && <> &bull; avg: {avgScore}/5</>}
                </span>
              </h3>

              {/* Horizontal bar chart */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {countByValue.map(f => (
                  <div key={f.value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22, width: 32, textAlign: "center" }}>{f.emoji}</span>
                    <div style={{ flex: 1, height: 26, background: "rgba(255,255,255,0.03)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                      <div style={{
                        height: "100%",
                        width: `${(f.count / maxCount) * 100}%`,
                        background: f.count > 0 ? "linear-gradient(90deg, #2563eb, #38bdf8)" : "transparent",
                        borderRadius: 6,
                        transition: "width 0.4s ease",
                        minWidth: f.count > 0 ? 24 : 0,
                      }} />
                      {f.count > 0 && (
                        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "#fff" }}>{f.count}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#5e7080", width: 55, textAlign: "right" }}>{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Individual responses (facilitator view) */}
              {facilitatorMode && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ ...S.facPill, background: "rgba(200,80,120,0.1)" }}>FACILITATOR VIEW</span>
                    <button style={S.facReset} onClick={resetFeedback}>Reset Feedback</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {feedbackData.map((f, i) => (
                      <div key={i} style={S.fbChip}>
                        <span style={{ fontSize: 16 }}>{FEEDBACK_FACES.find(fc => fc.value === f.value)?.emoji}</span>
                        <span style={{ fontSize: 11, color: "#a0b4c4" }}>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ======== STYLES ========
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

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 9, marginBottom: 18 },
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

  // Resource type picker grid
  rtGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginTop: 4,
  },
  rtCard: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 9, padding: "10px", cursor: "pointer", transition: "all 0.15s",
    display: "flex", flexDirection: "column", gap: 2,
  },
  rtCardActive: {
    background: "rgba(99,179,237,0.08)", borderColor: "rgba(99,179,237,0.35)",
    boxShadow: "0 0 0 1px rgba(99,179,237,0.15)",
  },

  summaryBox: {
    marginTop: 14, padding: "10px 14px",
    background: "rgba(99,179,237,0.04)", border: "1px solid rgba(99,179,237,0.1)",
    borderRadius: 8,
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

  // Name gate (full-screen entry)
  nameGate: {
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    minHeight: "100dvh", padding: "40px 20px", textAlign: "center",
  },
  nameBox: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    padding: "24px 28px", background: "rgba(251,191,36,0.05)",
    border: "1px solid rgba(251,191,36,0.15)", borderRadius: 14,
    marginTop: 24, width: "100%", maxWidth: 360,
  },
  skipBtn: {
    background: "none", border: "none", color: "#556", fontSize: 12,
    marginTop: 32, cursor: "pointer", opacity: 0.6, textDecoration: "underline",
  },

  // Name prompt (legacy, kept for reference)
  namePrompt: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    padding: "16px 20px", background: "rgba(251,191,36,0.05)",
    border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, marginBottom: 4, width: "100%", maxWidth: 320,
  },

  // Feedback
  feedbackWrap: { padding: "24px 16px 60px", maxWidth: 540, margin: "0 auto" },
  feedbackCard: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "28px 22px", marginBottom: 18,
  },
  faceRow: {
    display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap",
  },
  faceBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    padding: "12px 14px", borderRadius: 12, cursor: "pointer",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    transition: "all 0.15s", minWidth: 70,
  },
  feedbackResults: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 12, padding: "18px 20px",
  },
  fbChip: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "4px 10px",
  },
};

export default App;
