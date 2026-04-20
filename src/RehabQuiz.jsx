import { useState } from "react";

// ─── AIRTABLE CONFIG ──────────────────────────────────────────────────────────
// Replace these with your own values (see SETUP.md)
const AIRTABLE_PAT    = "YOUR_PERSONAL_ACCESS_TOKEN";
const AIRTABLE_BASE   = "YOUR_BASE_ID";
const AIRTABLE_TABLE  = "Responses"; // must match your table name exactly
// ─────────────────────────────────────────────────────────────────────────────

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const QUESTIONS = [
  {
    id: "importance", section: "Motivation & Readiness", sectionNum: 1,
    text: "How important is improving your rehab or exercise routine to you right now?",
    type: "scale", min: 1, max: 5,
    labels: ["Not a priority", "The most important thing"],
  },
  {
    id: "confidence", section: "Motivation & Readiness", sectionNum: 1,
    text: "If you had the right support, how confident are you that you could stick to a plan?",
    type: "scale", min: 1, max: 5,
    labels: ["Not at all confident", "Completely confident"],
  },
  {
    id: "stage", section: "Motivation & Readiness", sectionNum: 1,
    text: "Which best describes where you're at right now?",
    type: "single",
    options: [
      { value: 1, label: "Just thinking about it" },
      { value: 2, label: "Ready to start" },
      { value: 3, label: "Trying but struggling" },
      { value: 4, label: "Looking to level up" },
    ],
  },
  {
    id: "barriers", section: "Current Struggles", sectionNum: 2,
    text: "What gets in the way of your consistency? Select all that apply.",
    type: "multi",
    options: [
      "Forgetting to do it",
      "Pain or discomfort",
      "Not sure I'm doing it right",
      "Motivation dips",
      "Life gets too busy",
      "Not seeing progress",
      "Boredom with the routine",
    ],
  },
  {
    id: "frequency", section: "Current Struggles", sectionNum: 2,
    text: "How often do you miss planned exercise or rehab sessions?",
    type: "single",
    options: [
      { value: 1, label: "Rarely — I'm pretty consistent" },
      { value: 2, label: "Sometimes — once or twice a week" },
      { value: 3, label: "Often — more than I'd like" },
      { value: 4, label: "Almost always — it's a real problem" },
    ],
  },
  {
    id: "recovery", section: "Current Struggles", sectionNum: 2,
    text: "When you miss a session, what usually happens next?",
    type: "single",
    options: [
      { value: 1, label: "I pick up the next day — no big deal" },
      { value: 2, label: "I feel guilty but get back to it" },
      { value: 3, label: "I tend to skip several more" },
      { value: 4, label: "I often forget about it entirely" },
    ],
  },
  {
    id: "goal", section: "Goals & Success", sectionNum: 3,
    text: "What is your main goal right now?",
    type: "single",
    options: [
      { value: "sport",    label: "Return to sport or activity" },
      { value: "pain",     label: "Reduce pain or discomfort" },
      { value: "function", label: "Improve daily function" },
      { value: "fitness",  label: "General fitness & wellbeing" },
      { value: "self",     label: "Prove to myself I can do it" },
    ],
  },
  {
    id: "support", section: "Goals & Success", sectionNum: 3,
    text: "What kind of support would help you most? Select all that apply.",
    type: "multi",
    options: [
      "Reminders & nudges",
      "Progress tracking",
      "Guidance on exercises",
      "Accountability check-ins",
      "Understanding why it matters",
      "Community & shared journeys",
    ],
  },
  {
    id: "success", section: "Goals & Success", sectionNum: 3,
    text: "In 3 months, what would success look like for you?",
    type: "single",
    options: [
      { value: "consistent", label: "Being consistent with my routine" },
      { value: "milestone",  label: "Reaching a specific physical milestone" },
      { value: "pain_free",  label: "Feeling pain-free or significantly better" },
      { value: "confident",  label: "Feeling confident in my body again" },
      { value: "habit",      label: "Exercise feeling like a natural habit" },
    ],
  },
];

const PROFILES = {
  driven: {
    type: "The Driven but Derailed", icon: "🔥", accent: "#F5A623", bg: "#FFF8E6",
    description: "You know what you want — and the motivation is real. But life, pain, or habit keeps knocking you off course. The drive is there; what's missing is the right structure to channel it.",
    fit: "RehabPath was built for people exactly like you. You're already motivated — you just need a system that works as hard as you do.",
  },
  achiever: {
    type: "The Ready Achiever", icon: "⚡", accent: "#112240", bg: "#E8EFF8",
    description: "You're motivated, have relatively few blockers, and are primed to make real progress. You have the clarity — what you need now is a structured pathway to direct that energy.",
    fit: "You're in an ideal position to see results quickly. A guided plan with milestone tracking could take you further than you expect.",
  },
  explorer: {
    type: "The Cautious Explorer", icon: "🌱", accent: "#1a3a5c", bg: "#EBF3FA",
    description: "You're still finding your 'why' — and that's completely valid. There are a few things in the way right now, but readiness often builds through small wins, not big commitments.",
    fit: "Starting small matters. An approach that reduces friction and celebrates micro-progress could be the shift you need.",
  },
  mover: {
    type: "The Passive Mover", icon: "🌀", accent: "#4a6478", bg: "#EDF1F5",
    description: "You have fewer obstacles than you might realise — the path is clearer than it feels. What's needed is a gentle nudge and a reason to make it feel worth prioritising.",
    fit: "Sometimes just making it easier and more visible is enough to build real momentum.",
  },
};

function getProfile(answers) {
  const motivation = ((answers.importance || 3) + (answers.confidence || 3)) / 2;
  const barrierCount = (answers.barriers || []).length;
  if (motivation >= 3.5 && barrierCount >= 3) return { key: "driven",   ...PROFILES.driven };
  if (motivation >= 3.5 && barrierCount <  3) return { key: "achiever", ...PROFILES.achiever };
  if (motivation <  3.5 && barrierCount >= 3) return { key: "explorer", ...PROFILES.explorer };
  return { key: "mover", ...PROFILES.mover };
}

function goalLabel(answers) {
  return QUESTIONS.find(q => q.id === "goal")?.options
    .find(o => o.value === (answers.goal?.value ?? answers.goal))?.label || "";
}
function successLabel(answers) {
  return QUESTIONS.find(q => q.id === "success")?.options
    .find(o => o.value === (answers.success?.value ?? answers.success))?.label || "";
}
function stageLabel(answers) {
  return QUESTIONS.find(q => q.id === "stage")?.options
    .find(o => o.value === (answers.stage?.value ?? answers.stage))?.label || "";
}
function freqLabel(answers) {
  return QUESTIONS.find(q => q.id === "frequency")?.options
    .find(o => o.value === (answers.frequency?.value ?? answers.frequency))?.label || "";
}
function recoveryLabel(answers) {
  return QUESTIONS.find(q => q.id === "recovery")?.options
    .find(o => o.value === (answers.recovery?.value ?? answers.recovery))?.label || "";
}

async function submitToAirtable(contactInfo, answers, profile) {
  const fields = {
    "Name":             contactInfo.name || "(anonymous)",
    "Email":            contactInfo.email || "",
    "Profile":          profile.type,
    "Profile Key":      profile.key,
    "Importance Score": answers.importance ?? null,
    "Confidence Score": answers.confidence ?? null,
    "Readiness Stage":  stageLabel(answers),
    "Barriers":         (answers.barriers || []).join(", "),
    "Barrier Count":    (answers.barriers || []).length,
    "Miss Frequency":   freqLabel(answers),
    "After Miss":       recoveryLabel(answers),
    "Main Goal":        goalLabel(answers),
    "Support Needed":   (answers.support || []).join(", "),
    "Success Vision":   successLabel(answers),
    "Submitted At":     new Date().toISOString(),
  };

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIRTABLE_PAT}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ fields }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Submission failed");
  }
  return res.json();
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
  ${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; }

  .quiz-wrap {
    min-height: 100vh;
    background: #F0F4F8;
    display: flex; align-items: center; justify-content: center;
    padding: 24px 16px;
  }
  .card {
    background: #fff;
    border-radius: 20px;
    padding: 48px 44px;
    max-width: 580px; width: 100%;
    box-shadow: 0 4px 32px rgba(60,40,20,0.08), 0 1px 4px rgba(60,40,20,0.04);
  }
  @media (max-width: 500px) { .card { padding: 32px 24px; } }

  .progress-bar-track {
    height: 4px; background: #D8E4EE; border-radius: 2px;
    margin-bottom: 36px; overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #F5A623, #FFD080);
    border-radius: 2px; transition: width 0.4s ease;
  }

  .section-label {
    font-size: 11px; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: #F5A623; margin-bottom: 10px;
  }
  .question-text {
    font-family: 'Instrument Serif', serif;
    font-size: 26px; line-height: 1.35; color: #0B1929; margin-bottom: 32px;
  }
  .counter { font-size: 13px; color: #8FA3B4; margin-bottom: 6px; font-weight: 500; }

  .options-list { display: flex; flex-direction: column; gap: 10px; }
  .opt-btn {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border-radius: 12px;
    border: 1.5px solid #C8D8E8; background: #F7FAFD;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 15px; color: #112240; text-align: left;
    transition: all 0.15s ease;
  }
  .opt-btn:hover { border-color: #F5A623; background: #FFF8E6; transform: translateX(3px); }
  .opt-btn.selected { border-color: #F5A623; background: #FFF8E6; font-weight: 500; }
  .opt-check {
    width: 20px; height: 20px; border-radius: 50%;
    border: 2px solid #A8C0D4; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .opt-btn.selected .opt-check { background: #F5A623; border-color: #F5A623; }
  .opt-check-inner { width: 8px; height: 8px; background: #0B1929; border-radius: 50%; }

  .scale-wrap { display: flex; flex-direction: column; gap: 20px; }
  .scale-btns { display: flex; gap: 8px; }
  .scale-btn {
    flex: 1; aspect-ratio: 1; border-radius: 10px;
    border: 1.5px solid #C8D8E8; background: #F7FAFD;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 16px; font-weight: 500; color: #112240;
    transition: all 0.15s ease;
    display: flex; align-items: center; justify-content: center;
  }
  .scale-btn:hover { border-color: #F5A623; background: #FFF8E6; }
  .scale-btn.active { background: #F5A623; border-color: #F5A623; color: #0B1929; font-weight: 600; }
  .scale-labels { display: flex; justify-content: space-between; font-size: 12px; color: #8FA3B4; }

  .next-btn {
    margin-top: 28px; padding: 14px 28px;
    background: #0B1929; color: white; border: none;
    border-radius: 10px; font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 500; cursor: pointer;
    transition: background 0.2s; width: 100%;
  }
  .next-btn:hover { background: #F5A623; color: #0B1929; }
  .next-btn:disabled { opacity: 0.35; cursor: default; }
  .next-btn:hover:disabled { background: #0B1929; }

  /* Intro */
  .intro-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: #FFF8E6; color: #C07800;
    font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 6px 12px; border-radius: 20px; margin-bottom: 20px;
  }
  .intro-title {
    font-family: 'Instrument Serif', serif;
    font-size: 36px; line-height: 1.2; color: #0B1929; margin-bottom: 16px;
  }
  .intro-sub { font-size: 16px; color: #4a6478; line-height: 1.6; margin-bottom: 32px; }
  .intro-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
  .pill { padding: 6px 14px; background: #E8EFF8; border-radius: 20px; font-size: 13px; color: #112240; font-weight: 500; }
  .start-btn {
    padding: 16px 40px; background: #F5A623; color: #0B1929; border: none;
    border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 600;
    cursor: pointer; transition: background 0.2s, transform 0.1s; width: 100%;
  }
  .start-btn:hover { background: #C07800; transform: translateY(-1px); }

  /* Capture */
  .capture-sub { font-size: 15px; color: #4a6478; line-height: 1.6; margin-bottom: 28px; }
  .field-group { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
  .field-wrap { display: flex; flex-direction: column; gap: 6px; }
  .field-label { font-size: 12px; font-weight: 600; color: #112240; letter-spacing: 0.06em; text-transform: uppercase; }
  .field-input {
    padding: 13px 16px; border: 1.5px solid #C8D8E8; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; color: #0B1929;
    background: #F7FAFD; outline: none; transition: border-color 0.15s;
  }
  .field-input:focus { border-color: #F5A623; background: #fff; }
  .field-input::placeholder { color: #A8BDD0; }
  .privacy-note { font-size: 12px; color: #8FA3B4; line-height: 1.5; margin-bottom: 20px; }
  .submit-btn {
    padding: 15px; background: #F5A623; color: #0B1929; border: none;
    border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
    cursor: pointer; width: 100%; transition: background 0.2s, transform 0.1s;
  }
  .submit-btn:hover:not(:disabled) { background: #C07800; transform: translateY(-1px); }
  .submit-btn:disabled { opacity: 0.5; cursor: default; }
  .skip-link {
    display: block; text-align: center; margin-top: 14px;
    font-size: 13px; color: #8FA3B4; cursor: pointer;
    text-decoration: underline; text-underline-offset: 2px;
  }
  .skip-link:hover { color: #112240; }

  /* Results */
  .result-icon { font-size: 48px; margin-bottom: 16px; }
  .result-type { font-family: 'Instrument Serif', serif; font-size: 30px; color: #0B1929; margin-bottom: 16px; }
  .result-desc { font-size: 15px; color: #1a3a5c; line-height: 1.7; margin-bottom: 20px; }
  .result-fit-box { border-radius: 12px; padding: 18px 20px; margin-bottom: 28px; }
  .result-fit-label { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
  .result-fit-text { font-size: 14px; line-height: 1.65; }
  .summary-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
  .chip { padding: 5px 12px; background: #E8EFF8; border-radius: 20px; font-size: 12px; color: #112240; font-weight: 500; }
  .cta-btn {
    padding: 15px 32px; border: none; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
    cursor: pointer; width: 100%; transition: opacity 0.2s, transform 0.1s; color: white;
  }
  .cta-btn:hover { opacity: 0.88; transform: translateY(-1px); }
  .restart-btn {
    margin-top: 12px; padding: 12px; background: none;
    border: 1.5px solid #C8D8E8; border-radius: 10px;
    font-family: 'DM Sans', sans-serif; font-size: 14px; color: #8FA3B4;
    cursor: pointer; width: 100%; transition: border-color 0.2s, color 0.2s;
  }
  .restart-btn:hover { border-color: #F5A623; color: #F5A623; }

  .spinner {
    display: inline-block; width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
    border-radius: 50%; animation: spin 0.7s linear infinite;
    vertical-align: middle; margin-right: 8px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function RehabQuiz() {
  const [phase,      setPhase]      = useState("intro");
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState({});
  const [scaleVal,   setScaleVal]   = useState(null);
  const [visible,    setVisible]    = useState(true);
  const [contact,    setContact]    = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const q        = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;
  const profile  = (phase === "results") ? getProfile(answers) : null;

  const transition = (fn) => {
    setVisible(false);
    setTimeout(() => { fn(); setVisible(true); }, 260);
  };

  const advance = (newAnswers) => {
    transition(() => {
      if (current < QUESTIONS.length - 1) {
        setCurrent(c => c + 1);
        setScaleVal(null);
      } else {
        setPhase("capture");
      }
    });
  };

  const handleSingle = (option) => {
    const updated = { ...answers, [q.id]: option };
    setAnswers(updated);
    setTimeout(() => advance(updated), 180);
  };

  const handleMultiToggle = (opt) => {
    const vals = answers[q.id] || [];
    setAnswers({
      ...answers,
      [q.id]: vals.includes(opt) ? vals.filter(v => v !== opt) : [...vals, opt],
    });
  };

  const handleScaleNext = () => {
    if (scaleVal === null) return;
    const updated = { ...answers, [q.id]: scaleVal };
    setAnswers(updated);
    advance(updated);
  };

  const handleSubmit = async (skip = false) => {
    setSubmitting(true);
    const p    = getProfile(answers);
    const info = skip ? { name: "", email: "" } : contact;
    try {
      await submitToAirtable(info, answers, p);
    } catch (err) {
      console.warn("Airtable error (results still shown):", err.message);
    } finally {
      setSubmitting(false);
      transition(() => setPhase("results"));
    }
  };

  const restart = () => {
    transition(() => {
      setPhase("intro");
      setCurrent(0);
      setAnswers({});
      setScaleVal(null);
      setContact({ name: "", email: "" });
    });
  };

  const fadeStyle = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "translateY(0)" : "translateY(10px)",
    transition: "opacity 0.26s ease, transform 0.26s ease",
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  const canSubmit  = contact.name.trim().length > 0 && emailValid && !submitting;

  // ── Intro ─────────────────────────────────────────────────────────────────
  const renderIntro = () => (
    <div style={fadeStyle}>
      <div className="intro-badge">🩹 RehabPath · 5-min assessment</div>
      <h1 className="intro-title">Find out what's holding your recovery back</h1>
      <p className="intro-sub">
        Answer 9 quick questions about your motivation, current challenges, and goals.
        You'll receive a personalised profile showing exactly where you are — and what could help.
      </p>
      <div className="intro-pills">
        <span className="pill">✦ Motivation & readiness</span>
        <span className="pill">✦ Adherence struggles</span>
        <span className="pill">✦ Goals & success</span>
      </div>
      <button className="start-btn" onClick={() => transition(() => setPhase("quiz"))}>
        Start the assessment →
      </button>
    </div>
  );

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const renderQuestion = () => {
    const multiSelected = answers[q.id] || [];
    return (
      <div style={fadeStyle}>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="counter">{current + 1} of {QUESTIONS.length}</div>
        <div className="section-label">Part {q.sectionNum} · {q.section}</div>
        <p className="question-text">{q.text}</p>

        {q.type === "single" && (
          <div className="options-list">
            {q.options.map(opt => (
              <button
                key={opt.value}
                className={`opt-btn${answers[q.id]?.value === opt.value ? " selected" : ""}`}
                onClick={() => handleSingle(opt)}
              >
                <span className="opt-check">
                  {answers[q.id]?.value === opt.value && <span className="opt-check-inner" />}
                </span>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {q.type === "scale" && (
          <div className="scale-wrap">
            <div className="scale-btns">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={`scale-btn${scaleVal === n ? " active" : ""}`}
                  onClick={() => setScaleVal(n)}
                >{n}</button>
              ))}
            </div>
            <div className="scale-labels">
              <span>{q.labels[0]}</span><span>{q.labels[1]}</span>
            </div>
            <button className="next-btn" onClick={handleScaleNext} disabled={scaleVal === null}>
              Continue →
            </button>
          </div>
        )}

        {q.type === "multi" && (
          <>
            <div className="options-list">
              {q.options.map(opt => (
                <button
                  key={opt}
                  className={`opt-btn${multiSelected.includes(opt) ? " selected" : ""}`}
                  onClick={() => handleMultiToggle(opt)}
                >
                  <span className="opt-check" style={{ borderRadius: "4px" }}>
                    {multiSelected.includes(opt) && <span className="opt-check-inner" style={{ borderRadius: "2px" }} />}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
            <button
              className="next-btn"
              onClick={() => advance()}
              disabled={multiSelected.length === 0}
              style={{ marginTop: "20px" }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    );
  };

  // ── Email Capture ─────────────────────────────────────────────────────────
  const renderCapture = () => (
    <div style={fadeStyle}>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: "100%" }} />
      </div>
      <div className="section-label">Almost there</div>
      <p className="question-text">Where should we send your results?</p>
      <p className="capture-sub">
        Enter your details to receive your personalised adherence profile and be first to hear
        when the RehabPath pilot opens.
      </p>
      <div className="field-group">
        <div className="field-wrap">
          <label className="field-label">First name</label>
          <input
            className="field-input" type="text" placeholder="e.g. Alex"
            value={contact.name}
            onChange={e => setContact({ ...contact, name: e.target.value })}
          />
        </div>
        <div className="field-wrap">
          <label className="field-label">Email address</label>
          <input
            className="field-input" type="email" placeholder="you@example.com"
            value={contact.email}
            onChange={e => setContact({ ...contact, email: e.target.value })}
          />
        </div>
      </div>
      <p className="privacy-note">
        🔒 Your details are used only for this pilot. We don't share your information with anyone.
      </p>
      <button className="submit-btn" onClick={() => handleSubmit(false)} disabled={!canSubmit}>
        {submitting
          ? <><span className="spinner" />Saving your results…</>
          : "See my results →"}
      </button>
      <span className="skip-link" onClick={() => !submitting && handleSubmit(true)}>
        Skip — just show me my results
      </span>
    </div>
  );

  // ── Results ───────────────────────────────────────────────────────────────
  const renderResults = () => {
    const p         = profile;
    const supports  = answers.support || [];
    const barriers  = answers.barriers || [];
    const gl        = goalLabel(answers);
    const sl        = successLabel(answers);
    const firstName = contact.name.trim().split(" ")[0];

    return (
      <div style={fadeStyle}>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: "100%" }} />
        </div>
        <div className="section-label" style={{ color: p.accent }}>
          {firstName ? `${firstName}'s results` : "Your results"}
        </div>
        <div className="result-icon">{p.icon}</div>
        <h2 className="result-type">{p.type}</h2>
        <p className="result-desc">{p.description}</p>

        <div className="result-fit-box" style={{ background: p.bg }}>
          <div className="result-fit-label" style={{ color: p.accent }}>What this means for you</div>
          <p className="result-fit-text" style={{ color: "#0B1929" }}>{p.fit}</p>
        </div>

        {(gl || sl || supports.length > 0 || barriers.length > 0) && (
          <div style={{ marginBottom: "28px" }}>
            <div className="section-label" style={{ marginBottom: "10px" }}>Your snapshot</div>
            <div className="summary-chips">
              {gl && <span className="chip">🎯 {gl}</span>}
              {sl && <span className="chip">✦ {sl}</span>}
              {supports.slice(0, 3).map(s => <span key={s} className="chip">🤝 {s}</span>)}
              {barriers.slice(0, 2).map(b => (
                <span key={b} className="chip" style={{ background: "#FFF8E6", color: "#C07800" }}>⚡ {b}</span>
              ))}
            </div>
          </div>
        )}

        <button
          className="cta-btn"
          style={{ background: p.accent, color: p.key === "driven" ? "#0B1929" : "white" }}
          onClick={() => alert("Wire this to your pilot signup URL")}
        >
          Join the RehabPath pilot →
        </button>
        <button className="restart-btn" onClick={restart}>↩ Start over</button>
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="quiz-wrap">
        <div className="card">
          {phase === "intro"   && renderIntro()}
          {phase === "quiz"    && renderQuestion()}
          {phase === "capture" && renderCapture()}
          {phase === "results" && renderResults()}
        </div>
      </div>
    </>
  );
}
