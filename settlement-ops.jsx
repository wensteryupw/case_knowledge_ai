import { useState, useRef } from "react";
import { buildSystemPrompt, buildUserContent } from "./prompts";

const ACCENT = "#38BDF8";
const BG = "#0B0F1A";
const SURFACE = "#131A2B";
const CARD = "#1A2236";
const BORDER = "#1F2A3F";
const MUTED = "#7B8BA5";
const DIM = "#4A5A75";

function Pill({ bg, color, children }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 99, background: bg, color, textTransform: "uppercase", letterSpacing: ".05em" }}>{children}</span>;
}

function Card({ children, style }) {
  return <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18, marginBottom: 14, ...style }}>{children}</div>;
}

function SectionHead({ icon, children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: MUTED, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>{icon} {children}</div>;
}

/* ── Upload Screen ── */
function UploadScreen({ onProcess, error }) {
  const [f1, setF1] = useState(null);
  const [f2, setF2] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("anthropic_api_key") || "");
  const r1 = useRef(null);
  const r2 = useRef(null);

  const dropZone = (file, setFile, ref, label, sub, icon, optional) => (
    <div onClick={() => ref.current?.click()}
      style={{ border: `2px dashed ${file ? "#10B981" : BORDER}`, borderRadius: 14, padding: "32px 24px", textAlign: "center", cursor: "pointer", background: file ? "#064E3B22" : SURFACE, transition: "all .2s", position: "relative" }}>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" ref={ref} hidden onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
      {optional && <div style={{ position: "absolute", top: 10, right: 12 }}><Pill bg={SURFACE} color={DIM}>Optional</Pill></div>}
      <div style={{ fontSize: 28, marginBottom: 6 }}>{file ? "✅" : icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: MUTED }}>{sub}</div>
      {file ? (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Pill bg="#064E3B" color="#10B981">{file.name}</Pill>
          {optional && <span onClick={e => { e.stopPropagation(); setFile(null); ref.current.value = ""; }} style={{ fontSize: 14, cursor: "pointer", color: MUTED, lineHeight: 1 }} title="Remove">✕</span>}
        </div>
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: DIM }}>Drop PDF or image here, or click to browse</div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 600, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #6366F1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚖</div>
            <span style={{ fontSize: 20, fontWeight: 700 }}>Settlement Ops</span>
          </div>
          <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.7 }}>
            Upload your <strong style={{ color: "#E2E8F0" }}>Settlement Agreement</strong> to generate an operational dashboard. Optionally include an <strong style={{ color: "#E2E8F0" }}>Administrative Bid</strong> for cross-reference and conflict audit.
          </p>
        </div>

        <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
          {dropZone(f1, setF1, r1, "Settlement Agreement", "The legal \"What\" — Required", "📜", false)}
          {dropZone(f2, setF2, r2, "Administrative Bid / Proposal", "The operational \"How\" — For conflict audit", "📋", true)}
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); localStorage.setItem("anthropic_api_key", e.target.value); }}
            placeholder="sk-ant-..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: SURFACE, color: "#E2E8F0", fontSize: 13, outline: "none" }}
          />
        </div>

        {error && <div style={{ background: "#7F1D1D", border: "1px solid #EF444444", borderRadius: 10, padding: 12, marginBottom: 18, fontSize: 13, color: "#FCA5A5" }}>⚠ {error}</div>}

        <div style={{ textAlign: "center" }}>
          <button disabled={!f1 || !apiKey} onClick={() => onProcess(f1, f2, apiKey)}
            style={{ background: (!f1 || !apiKey) ? "#333" : `linear-gradient(135deg, ${ACCENT}, #6366F1)`, color: "#fff", border: "none", padding: "13px 36px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: (!f1 || !apiKey) ? "not-allowed" : "pointer", opacity: (!f1 || !apiKey) ? 0.4 : 1 }}>
            {f2 ? "Analyze & Cross-Reference →" : "Analyze Settlement →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Processing Screen ── */
function ProcessingScreen({ progress, msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 20 }}>⚖</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Cross-Referencing Documents</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>{msg}</div>
        <div style={{ background: SURFACE, borderRadius: 99, height: 7, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT}, #6366F1)`, width: `${progress}%`, transition: "width .5s" }} />
        </div>
        <div style={{ fontSize: 12, color: DIM, fontFamily: "monospace" }}>{progress}%</div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({ data, onReset }) {
  const [tab, setTab] = useState("timeline");
  const [checks, setChecks] = useState({});
  const toggle = k => setChecks(p => ({ ...p, [k]: !p[k] }));

  const tl = data.timeline || {};
  const ms = tl.milestones || [];
  const cls = data.class_specs || {};
  const np = data.notice_plan || {};
  const fund = data.fund_logistics || {};
  const cl = data.claims_logic || {};
  const ops = data.operational_checklist || {};
  const conflicts = data.conflict_audit || [];

  const catLabels = { data_intake: "💾 Data Intake", notice_phase: "📬 Notice Phase", claims_processing: "📝 Claims Processing", support: "📞 Support", payment: "💰 Payment", reporting: "📊 Reporting" };
  const allItems = Object.entries(ops).flatMap(([c, items]) => (items || []).map((it, i) => ({ ...it, key: `${c}-${i}` })));
  const done = allItems.filter(i => checks[i.key]).length;

  const sevColor = s => s === "critical" ? { bg: "#7F1D1D", fg: "#EF4444" } : s === "warning" ? { bg: "#78350F", fg: "#F59E0B" } : { bg: "#0C4A6E", fg: ACCENT };
  const statColor = s => s === "critical" ? { bg: "#7F1D1D", fg: "#FCA5A5" } : s === "upcoming" ? { bg: "#78350F", fg: "#FCD34D" } : { bg: "#0C4A6E22", fg: ACCENT };

  const tabs = [
    { id: "timeline", label: "📅 Timeline" },
    { id: "checklist", label: "✅ Checklist" },
    { id: "audit", label: `⚠️ Audit${conflicts.length > 0 ? ` (${conflicts.length})` : ""}` },
    { id: "specs", label: "📊 Details" },
    { id: "json", label: "{ } JSON" },
  ];

  return (
    <div>
      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `linear-gradient(135deg, ${ACCENT}, #6366F1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚖</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{data.case_name || "Settlement Dashboard"}</div>
            <div style={{ fontSize: 11, color: MUTED }}>{data.case_number ? `Case ${data.case_number}` : ""}{data.jurisdiction ? ` · ${data.jurisdiction}` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill bg={data.settlement_type === "Claims-Made" ? "#78350F" : "#064E3B"} color={data.settlement_type === "Claims-Made" ? "#F59E0B" : "#10B981"}>{data.settlement_type || "TBD"}</Pill>
          {fund.gross_settlement && <Pill bg="#3B1F7A" color="#A78BFA">{fund.gross_settlement}</Pill>}
          <button onClick={onReset} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "5px 12px", color: MUTED, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>New</button>
        </div>
      </div>

      {/* Summary */}
      {data.summary && <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, background: SURFACE, fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{data.summary}</div>}

      {/* Tabs */}
      <div style={{ padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 4, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "8px 14px", borderRadius: 8, border: tab === t.id ? `1px solid ${BORDER}` : "1px solid transparent", background: tab === t.id ? SURFACE : "transparent", color: tab === t.id ? ACCENT : MUTED, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: 20, maxWidth: 960, margin: "0 auto" }}>

        {/* TIMELINE */}
        {tab === "timeline" && <div>
          <SectionHead icon="📅">Critical Milestone Timeline</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              ["Preliminary Approval", tl.preliminary_approval, "T+0"],
              ["Notice Deadline", tl.notice_deadline],
              ["Exclusion/Objection", tl.exclusion_objection_deadline],
              ["Claims Deadline", tl.claims_deadline],
              ["Final Approval", tl.final_approval_hearing],
              ["Distribution", tl.distribution_date],
            ].map(([label, val, tag], i) => (
              <Card key={i} style={{ padding: 12, marginBottom: 0 }}>
                <div style={{ fontSize: 10, color: DIM, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: val?.includes("TBD") ? "#F59E0B" : "#E2E8F0" }}>{val || "[Not Specified]"}</div>
                {tag && <div style={{ marginTop: 5 }}><Pill bg="#0C4A6E" color={ACCENT}>{tag}</Pill></div>}
              </Card>
            ))}
          </div>
          <Card>
            <SectionHead icon="">Milestones</SectionHead>
            {ms.length === 0 ? <div style={{ color: DIM, fontSize: 13 }}>No milestones extracted.</div> :
              ms.map((m, i) => {
                const sc = statColor(m.status);
                return (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: i < ms.length - 1 ? `1px solid ${BORDER}` : "none", flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: ACCENT, minWidth: 60 }}>{m.t_minus || "—"}</div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{m.label}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{m.date}{m.notes ? ` · ${m.notes}` : ""}</div>
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, minWidth: 80 }}>{m.owner || ""}</div>
                    <Pill bg={sc.bg} color={sc.fg}>{m.status}</Pill>
                  </div>
                );
              })}
          </Card>
        </div>}

        {/* CHECKLIST */}
        {tab === "checklist" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionHead icon="✅">Operational Checklist</SectionHead>
            <span style={{ fontSize: 12, color: MUTED }}><strong style={{ color: ACCENT }}>{done}</strong> / {allItems.length}</span>
          </div>
          <div style={{ background: SURFACE, borderRadius: 99, height: 5, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT}, #10B981)`, width: allItems.length ? `${(done / allItems.length) * 100}%` : "0%", transition: "width .3s" }} />
          </div>
          {Object.entries(ops).map(([cat, items]) => {
            if (!items?.length) return null;
            return (
              <Card key={cat}>
                <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, marginBottom: 10 }}>{catLabels[cat] || cat}</div>
                {items.map((it, i) => {
                  const k = `${cat}-${i}`;
                  const d = checks[k];
                  return (
                    <div key={k} onClick={() => toggle(k)} style={{ display: "flex", gap: 10, padding: "10px 8px", borderRadius: 8, cursor: "pointer", alignItems: "flex-start" }}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${d ? ACCENT : BORDER}`, background: d ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: "#fff", marginTop: 1 }}>{d ? "✓" : ""}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: d ? DIM : "#E2E8F0", textDecoration: d ? "line-through" : "none" }}>{it.task}</div>
                        {it.details && <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{it.details}</div>}
                        {it.deadline_ref && <div style={{ marginTop: 4 }}><Pill bg="#0C4A6E" color={ACCENT}>{it.deadline_ref}</Pill></div>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            );
          })}
        </div>}

        {/* CONFLICT AUDIT */}
        {tab === "audit" && <div>
          <SectionHead icon="⚠️">Conflict Audit — Settlement vs. Bid</SectionHead>
          {conflicts.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 36 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No Discrepancies to Show</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.6 }}>
                {data._hasBid === false
                  ? "No Administrative Bid was provided. Upload a Bid alongside the Settlement to enable cross-reference conflict auditing."
                  : "The Bid appears to align with the Settlement Agreement."}
              </div>
            </Card>
          ) : <>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              {["critical", "warning", "info"].map(s => {
                const c = conflicts.filter(x => x.severity === s).length;
                if (!c) return null;
                const sc = sevColor(s);
                return <Card key={s} style={{ flex: 1, marginBottom: 0, padding: 12, borderLeft: `3px solid ${sc.fg}` }}><div style={{ fontSize: 20, fontWeight: 700, color: sc.fg }}>{c}</div><div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "capitalize" }}>{s}</div></Card>;
              })}
            </div>
            {conflicts.map((c, i) => {
              const sc = sevColor(c.severity);
              return (
                <Card key={i} style={{ borderLeft: `3px solid ${sc.fg}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.category}</span>
                    <Pill bg={sc.bg} color={sc.fg}>{c.severity}</Pill>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div style={{ background: SURFACE, borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", marginBottom: 4 }}>Settlement</div>
                      <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.settlement_says}</div>
                    </div>
                    <div style={{ background: SURFACE, borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", marginBottom: 4 }}>Bid</div>
                      <div style={{ fontSize: 12, lineHeight: 1.5 }}>{c.bid_says}</div>
                    </div>
                  </div>
                  {c.recommendation && <div style={{ fontSize: 12, color: ACCENT, lineHeight: 1.5 }}><strong>Rec:</strong> {c.recommendation}</div>}
                </Card>
              );
            })}
          </>}
        </div>}

        {/* CASE DETAILS */}
        {tab === "specs" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            <Card>
              <SectionHead icon="👥">Class Specs</SectionHead>
              {[["Est. Size", cls.estimated_size], ["Subclasses", cls.subclasses], ["Data Format", cls.data_format], ["Source", cls.data_source]].map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <span style={{ color: MUTED }}>{l}</span><span style={{ fontWeight: 600 }}>{v ?? "[N/S]"}</span>
                </div>
              ))}
            </Card>
            <Card>
              <SectionHead icon="📬">Notice Plan</SectionHead>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>{(np.channels || []).map((c, i) => <Pill key={i} bg="#0C4A6E" color={ACCENT}>{c}</Pill>)}</div>
              {[["Skip Tracing", np.skip_tracing], ["URL", np.dedicated_url], ["Toll-Free", np.toll_free_number]].map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <span style={{ color: MUTED }}>{l}</span><span style={{ fontWeight: 600 }}>{v || "TBD"}</span>
                </div>
              ))}
              {np.languages?.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>{np.languages.map((l, i) => <Pill key={i} bg="#3B1F7A" color="#A78BFA">{l}</Pill>)}</div>}
            </Card>
            <Card>
              <SectionHead icon="💰">Fund Logistics</SectionHead>
              {[["Gross", fund.gross_settlement], ["Admin Cap", fund.admin_cap], ["Atty Fees", fund.attorney_fees], ["Net Fund", fund.net_fund], ["QSF", fund.qsf_required ? "Yes" : "No"]].map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <span style={{ color: MUTED }}>{l}</span><span style={{ fontWeight: 600 }}>{v ?? "[N/S]"}</span>
                </div>
              ))}
              {fund.payment_methods?.length > 0 && <div style={{ marginTop: 8, display: "flex", gap: 5 }}>{fund.payment_methods.map((m, i) => <Pill key={i} bg="#064E3B" color="#10B981">{m}</Pill>)}</div>}
            </Card>
            <Card>
              <SectionHead icon="📝">Claims Logic</SectionHead>
              {[["Type", cl.type], ["Form Required", cl.form_required ? "Yes" : "No"], ["Proof", cl.proof_requirements]].map(([l, v], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
                  <span style={{ color: MUTED }}>{l}</span><span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v ?? "[N/S]"}</span>
                </div>
              ))}
              {cl.claim_tiers?.length > 0 && <div style={{ marginTop: 10 }}>{cl.claim_tiers.map((t, i) => (
                <div key={i} style={{ background: SURFACE, borderRadius: 7, padding: 8, marginBottom: 5 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{t.tier} — {t.amount}</div>
                  <div style={{ fontSize: 11, color: MUTED }}>{t.requirements}</div>
                </div>
              ))}</div>}
            </Card>
          </div>
        </div>}

        {/* JSON */}
        {tab === "json" && <div>
          <SectionHead icon="{ }">Raw JSON</SectionHead>
          <Card>
            <pre style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.6, color: MUTED, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 500, overflow: "auto" }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Card>
        </div>}
      </div>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [step, setStep] = useState("upload");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");

  const readFile = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Read failed"));
    r.readAsDataURL(file);
  });

  const mediaType = (f) => {
    const ext = f.name.toLowerCase().split(".").pop();
    if (ext === "pdf") return "application/pdf";
    return "image/" + (ext === "jpg" ? "jpeg" : ext);
  };

  const process = async (f1, f2, apiKey) => {
    const hasBid = !!f2;
    setStep("processing"); setError(null); setProgress(10); setProgressMsg("Reading documents…");
    try {
      const b1 = await readFile(f1);
      const b2 = hasBid ? await readFile(f2) : null;
      setProgress(30); setProgressMsg(hasBid ? "AI cross-referencing Settlement vs. Bid…" : "AI analyzing Settlement Agreement…");

      const systemBase = buildSystemPrompt(hasBid);
      const userContent = buildUserContent(hasBid, {
        b1,
        mediaType1: mediaType(f1),
        b2,
        mediaType2: f2 ? mediaType(f2) : undefined,
      });

      const resp = await fetch("/api/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          system: systemBase,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      setProgress(75); setProgressMsg("Parsing analysis…");
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      const text = (data.content || []).map(b => b.text || "").join("");
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse AI response.");

      setResult({ ...JSON.parse(match[0]), _hasBid: hasBid });
      setProgress(100); setProgressMsg("Done!");
      setTimeout(() => setStep("dashboard"), 300);
    } catch (err) {
      setError(err.message); setStep("upload");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'DM Sans', system-ui, sans-serif", color: "#E2E8F0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      {step === "upload" && <UploadScreen onProcess={process} error={error} />}
      {step === "processing" && <ProcessingScreen progress={progress} msg={progressMsg} />}
      {step === "dashboard" && <Dashboard data={result} onReset={() => { setStep("upload"); setResult(null); setError(null); }} />}
    </div>
  );
}
