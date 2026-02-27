import { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/* ── Light Theme Palette (Point Wild) ── */
const ACCENT = "#4F46E5";
const ACCENT_LIGHT = "#EEF2FF";
const ACCENT_TEXT = "#4338CA";
const BG = "#F5F7FA";
const WHITE = "#FFFFFF";
const BORDER = "#E5E7EB";
const BORDER_LIGHT = "#F3F4F6";
const TEXT = "#111827";
const TEXT_SEC = "#374151";
const MUTED = "#6B7280";
const DIM = "#9CA3AF";
const GREEN = "#059669";
const GREEN_BG = "#ECFDF5";
const AMBER = "#D97706";
const AMBER_BG = "#FFFBEB";
const RED = "#DC2626";
const RED_BG = "#FEF2F2";

function Pill({ bg, color, children }) {
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: bg, color, letterSpacing: ".02em" }}>{children}</span>;
}

function Card({ children, style }) {
  return <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,.04)", ...style }}>{children}</div>;
}

function SectionHead({ icon, children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: MUTED, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>{icon} {children}</div>;
}

/* ── Point Wild Logo (matching PW1.png: 3 diagonal pairs of dots) ── */
function Logo({ size = 28, color = TEXT }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      {/* Bottom pair */}
      <circle cx="5"  cy="28" r="3.8" fill={color} />
      <circle cx="13" cy="26" r="3.8" fill={color} />
      {/* Middle pair */}
      <circle cx="12" cy="18" r="3.8" fill={color} />
      <circle cx="20" cy="16" r="3.8" fill={color} />
      {/* Top pair */}
      <circle cx="21" cy="8"  r="3.8" fill={color} />
      <circle cx="29" cy="6"  r="3.8" fill={color} />
    </svg>
  );
}

/* ── Top Nav Bar ── */
function NavBar({ activePage, onNavigate }) {
  const links = [
    { id: "cases", label: "All Cases" },
    { id: "help", label: "Help" },
    { id: "settings", label: "Settings" },
  ];
  return (
    <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onNavigate("cases")}>
          <Logo size={28} />
          <span style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>Point Wild</span>
        </div>
        <nav style={{ display: "flex", gap: 6 }}>
          {links.map(l => (
            <button key={l.id} onClick={() => onNavigate(l.id)}
              style={{
                background: "none", border: "none", padding: "8px 14px", fontSize: 14, fontWeight: 500, cursor: "pointer", borderRadius: 6,
                color: activePage === l.id ? ACCENT : MUTED,
              }}>
              {l.label}
            </button>
          ))}
        </nav>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 99, background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`, display: "flex", alignItems: "center", justifyContent: "center", color: WHITE, fontSize: 14, fontWeight: 700, position: "relative" }}>
        PW
        <div style={{ width: 10, height: 10, borderRadius: 99, background: GREEN, border: `2px solid ${WHITE}`, position: "absolute", bottom: -1, right: -1 }} />
      </div>
    </div>
  );
}

/* ── Collapsible ── */
function Collapsible({ title, right, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "10px 14px", borderRadius: 8, background: BORDER_LIGHT, marginBottom: open ? 10 : 0, transition: "background .15s" }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {right}
          <span style={{ fontSize: 10, color: DIM, transition: "transform .2s", display: "inline-block", transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}>&#9660;</span>
        </div>
      </div>
      {open && children}
    </div>
  );
}

/* ── Citation Helpers ── */
function getCitations(data, path) {
  const c = data?.citations;
  if (!c) return null;
  if (c[path]) return c[path];
  // Try without the first segment prefix (e.g. "timeline.preliminary_approval" → "preliminary_approval")
  const dotIdx = path.indexOf(".");
  if (dotIdx > 0) {
    const short = path.slice(dotIdx + 1);
    if (c[short]) return c[short];
  }
  // Try adding "timeline." prefix for bare keys
  if (!path.includes(".") && c[`timeline.${path}`]) return c[`timeline.${path}`];
  return null;
}

function CiteBadge({ citations, onCiteClick }) {
  if (!citations || citations.length === 0) return null;
  return (
    <span style={{ display: "inline-flex", gap: 3, marginLeft: 6, verticalAlign: "middle" }}>
      {citations.map((c, i) => (
        <span
          key={i}
          onClick={(e) => { e.stopPropagation(); onCiteClick(c); }}
          title={`${c.doc} p.${c.page}: "${c.quote}"`}
          style={{
            display: "inline-block", fontSize: 10, fontWeight: 700, padding: "1px 5px",
            borderRadius: 4, background: c.doc === "settlement" ? ACCENT_LIGHT : AMBER_BG,
            color: c.doc === "settlement" ? ACCENT : AMBER, cursor: "pointer",
            fontFamily: "monospace", lineHeight: 1.4, userSelect: "none",
          }}
        >
          p.{c.page}
        </span>
      ))}
    </span>
  );
}

/* ── PDF Viewer Popup (canvas + text highlight + page nav) ── */
function PdfViewerModal({ open, onClose, caseId, citation, filenames }) {
  const canvasRef = useRef(null);
  const textLayerRef = useRef(null);
  const pdfDocRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightOk, setHighlightOk] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const prevDocKey = useRef(null);
  const renderIdRef = useRef(0);

  const citedPage = citation?.page || 1;
  const isSett = citation?.doc === "settlement";
  const filename = isSett ? filenames?.settlement : filenames?.bid;

  // Load PDF document (once per doc type)
  useEffect(() => {
    if (!open || !caseId || !citation) return;
    const docKey = `${caseId}-${citation.doc}`;
    if (prevDocKey.current === docKey && pdfDocRef.current) {
      setCurrentPage(citedPage);
      return;
    }
    prevDocKey.current = docKey;
    pdfDocRef.current = null;
    setLoading(true);
    setError(null);
    setTotalPages(0);
    setCurrentPage(citedPage);

    pdfjsLib.getDocument(`/api/cases/${caseId}/pdf/${citation.doc}`).promise.then(pdf => {
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      setCurrentPage(citedPage);
      setLoading(false);
    }).catch(e => {
      setError(e.message || "Failed to load PDF");
      setLoading(false);
    });
  }, [open, caseId, citation?.doc]);

  // Render current page to canvas
  useEffect(() => {
    const pdf = pdfDocRef.current;
    if (!pdf || loading) return;
    const id = ++renderIdRef.current;

    (async () => {
      try {
        const pageNum = Math.max(1, Math.min(currentPage, pdf.numPages));
        const page = await pdf.getPage(pageNum);
        if (id !== renderIdRef.current) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = 800 / baseViewport.width;
        const viewport = page.getViewport({ scale: fitScale });

        await new Promise(r => requestAnimationFrame(r));
        const canvas = canvasRef.current;
        if (!canvas || id !== renderIdRef.current) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        if (id !== renderIdRef.current) return;

        // Text layer
        const textContent = await page.getTextContent();
        const tlDiv = textLayerRef.current;
        if (!tlDiv) return;
        tlDiv.innerHTML = "";
        tlDiv.style.width = `${viewport.width}px`;
        tlDiv.style.height = `${viewport.height}px`;

        textContent.items.forEach(item => {
          if (!item.str) return;
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontSize = Math.abs(tx[3]);
          const span = document.createElement("span");
          span.textContent = item.str;
          Object.assign(span.style, {
            position: "absolute",
            left: `${tx[4]}px`,
            top: `${tx[5] - fontSize}px`,
            fontSize: `${fontSize}px`,
            fontFamily: "sans-serif",
            color: "transparent",
            whiteSpace: "pre",
          });
          tlDiv.appendChild(span);
        });

        // Highlight only on the cited page
        if (citation?.quote && pageNum === citedPage) {
          const found = highlightInTextLayer(tlDiv, citation.quote);
          setHighlightOk(found);
        } else {
          setHighlightOk(true);
        }
      } catch (e) {
        console.error("Page render error:", e);
      }
    })();
  }, [loading, currentPage]);

  // Keyboard: Escape to close, arrow keys to navigate
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "ArrowRight") setCurrentPage(p => Math.min(totalPages || p, p + 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose, totalPages]);

  // Reset when closed
  useEffect(() => {
    if (open && citation) setCurrentPage(citedPage);
  }, [open, citation?.page]);

  if (!open || !citation) return null;

  const navBtn = (disabled, onClick, label) => (
    <button disabled={disabled} onClick={onClick} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, color: disabled ? DIM : TEXT_SEC, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>{label}</button>
  );
  const isOnCitedPage = currentPage === citedPage;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "75%", maxWidth: 960, height: "85vh", background: WHITE, borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,.25)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header: filename + doc pill + close */}
        <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
            <Pill bg={isSett ? ACCENT_LIGHT : AMBER_BG} color={isSett ? ACCENT : AMBER}>{isSett ? "Settlement" : "Bid"}</Pill>
            <span style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename || (isSett ? "Settlement Document" : "Bid Document")}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: MUTED, cursor: "pointer", padding: "4px 8px", borderRadius: 6, lineHeight: 1, flexShrink: 0 }}>&times;</button>
        </div>
        {/* Nav bar: page controls + jump to cited page */}
        <div style={{ padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, background: BG }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {navBtn(currentPage <= 1, () => setCurrentPage(p => p - 1), "\u2190 Prev")}
            <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, minWidth: 80, textAlign: "center" }}>Page {currentPage} of {totalPages || "..."}</span>
            {navBtn(currentPage >= totalPages, () => setCurrentPage(p => p + 1), "Next \u2192")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isOnCitedPage && (
              <button onClick={() => setCurrentPage(citedPage)} style={{ background: ACCENT_LIGHT, border: `1px solid ${ACCENT}44`, borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: ACCENT, cursor: "pointer" }}>
                Jump to cited page {citedPage}
              </button>
            )}
            {isOnCitedPage && <span style={{ fontSize: 11, fontWeight: 600, color: GREEN }}>Viewing cited page</span>}
          </div>
        </div>
        {/* Quote callout — only on cited page */}
        {citation.quote && isOnCitedPage && (
          <div style={{ padding: "8px 20px", background: highlightOk ? "#FEF9C3" : AMBER_BG, borderBottom: `1px solid ${highlightOk ? "#FDE68A" : "#FDE68A"}`, fontSize: 12, color: highlightOk ? "#854D0E" : AMBER, flexShrink: 0 }}>
            <span style={{ fontWeight: 600 }}>{highlightOk ? "Highlighted:" : "Quote (not matched exactly):"}</span> &ldquo;{citation.quote}&rdquo;
          </div>
        )}
        {/* PDF render area */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center", background: "#e8e8e8", padding: "16px 0", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, background: "#e8e8e8" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>Loading PDF...</span>
            </div>
          )}
          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, background: "#e8e8e8" }}>
              <span style={{ color: RED, fontSize: 13 }}>{error}</span>
            </div>
          )}
          <div style={{ position: "relative", display: "inline-block", boxShadow: "0 2px 12px rgba(0,0,0,.15)", background: WHITE }}>
            <canvas ref={canvasRef} style={{ display: "block" }} />
            <div ref={textLayerRef} style={{ position: "absolute", top: 0, left: 0, overflow: "hidden" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function highlightInTextLayer(container, quote) {
  const spans = container.querySelectorAll("span");
  const normQuote = quote.replace(/\s+/g, " ").trim().toLowerCase();
  // Build one big string + char-to-span map
  let full = "";
  const map = [];
  spans.forEach(span => {
    for (const ch of span.textContent) { map.push(span); full += ch; }
    map.push(null); full += " ";
  });
  const normFull = full.replace(/\s+/g, " ").toLowerCase();
  // Try exact, then progressively shorter substrings for fuzzy match
  let idx = normFull.indexOf(normQuote);
  let matchLen = normQuote.length;
  if (idx === -1 && normQuote.length > 30) {
    // Try the middle 60% of the quote for fuzzy matching
    const start = Math.floor(normQuote.length * 0.2);
    const sub = normQuote.slice(start, start + Math.floor(normQuote.length * 0.6));
    idx = normFull.indexOf(sub);
    matchLen = sub.length;
  }
  if (idx === -1) return false;
  const matched = new Set();
  for (let i = idx; i < idx + matchLen && i < map.length; i++) { if (map[i]) matched.add(map[i]); }
  matched.forEach(s => {
    s.style.backgroundColor = "rgba(250, 204, 21, 0.5)";
    s.style.color = "transparent";
    s.style.borderRadius = "2px";
    s.style.padding = "1px 0";
    s.style.mixBlendMode = "multiply";
  });
  const first = [...matched][0];
  if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
  return true;
}

/* ── Upload Modal ── */
function UploadModal({ open, onClose, onProcess, error }) {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const ACCEPTED = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
  const addFiles = (incoming) => {
    const arr = Array.from(incoming).filter(f =>
      ACCEPTED.some(ext => f.name.toLowerCase().endsWith(ext))
    );
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...arr.filter(f => !existing.has(f.name + f.size))];
    });
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const readEntry = (entry) =>
    new Promise((resolve) => {
      if (entry.isFile) {
        entry.file(f => resolve([f]));
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        reader.readEntries(async (entries) => {
          const nested = await Promise.all(entries.map(readEntry));
          resolve(nested.flat());
        });
      } else {
        resolve([]);
      }
    });

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer.items;
    if (items) {
      const all = [];
      for (const item of items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry) { all.push(...await readEntry(entry)); }
      }
      if (all.length) { addFiles(all); return; }
    }
    addFiles(e.dataTransfer.files);
  };

  const hasFiles = files.length > 0;

  const handleSubmit = () => {
    onProcess(files);
    setFiles([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.35)" }} onClick={onClose} />
      <div style={{ position: "relative", background: WHITE, borderRadius: 16, padding: 28, width: "100%", maxWidth: 540, boxShadow: "0 20px 60px rgba(0,0,0,.15)", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT }}>New Case Analysis</div>
            <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>Upload settlement documents to generate a dashboard</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: DIM, cursor: "pointer", padding: 4 }}>&times;</button>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? ACCENT : hasFiles ? GREEN : BORDER}`,
            borderRadius: 12, padding: "28px 20px", textAlign: "center", cursor: "pointer",
            background: dragOver ? ACCENT_LIGHT : hasFiles ? GREEN_BG : BG,
            transition: "all .2s",
          }}
        >
          <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp" ref={fileRef} hidden
            onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
          <input type="file" webkitdirectory="" ref={folderRef} hidden
            onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
          <div style={{ fontSize: 28, marginBottom: 6 }}>{hasFiles ? "\u2705" : "\uD83D\uDCC1"}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 4 }}>
            {hasFiles ? `${files.length} file${files.length !== 1 ? "s" : ""} selected` : "Drop files or a folder here"}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            Click to browse, or{" "}
            <span
              onClick={e => { e.stopPropagation(); folderRef.current?.click(); }}
              style={{ color: ACCENT, textDecoration: "underline", cursor: "pointer" }}
            >select a folder</span>
          </div>
          <div style={{ fontSize: 11, color: DIM, marginTop: 8 }}>PDF, PNG, JPG, WEBP &mdash; First file = Settlement, second = Bid</div>
        </div>

        {/* File list */}
        {hasFiles && (
          <div style={{ marginTop: 14 }}>
            {files.map((f, i) => (
              <div key={f.name + f.size} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 12px", borderRadius: 8, background: BG,
                border: `1px solid ${BORDER}`, marginBottom: 4,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{i === 0 ? "\uD83D\uDCDC" : "\uD83D\uDCCB"}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</span>
                  {i === 0 && <Pill bg={ACCENT_LIGHT} color={ACCENT}>Settlement</Pill>}
                  {i === 1 && <Pill bg={AMBER_BG} color={AMBER}>Bid</Pill>}
                </div>
                <span onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                  style={{ fontSize: 16, cursor: "pointer", color: DIM, padding: "0 4px", flexShrink: 0 }} title="Remove">&times;</span>
              </div>
            ))}
          </div>
        )}

        {error && <div style={{ background: RED_BG, border: `1px solid #FECACA`, borderRadius: 8, padding: 10, marginTop: 14, fontSize: 12, color: RED }}>&#9888; {error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose}
            style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 600, color: TEXT_SEC, cursor: "pointer" }}>
            Cancel
          </button>
          <button disabled={!hasFiles} onClick={handleSubmit}
            style={{ background: hasFiles ? ACCENT : DIM, color: WHITE, border: "none", borderRadius: 8, padding: "9px 24px", fontSize: 13, fontWeight: 600, cursor: hasFiles ? "pointer" : "not-allowed", opacity: hasFiles ? 1 : 0.5 }}>
            {files.length > 1 ? "Analyze & Cross-Reference" : "Analyze Settlement"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Case Table ── */
function CaseTable({ cases, loading, onSelectCase, searchQuery, onSearchChange }) {
  const statusPill = (status) => {
    if (status === "completed") return <Pill bg={GREEN_BG} color={GREEN}>Completed</Pill>;
    if (status === "pending") return <Pill bg={AMBER_BG} color={AMBER}>Pending</Pill>;
    if (status === "analyzing") return <Pill bg={ACCENT_LIGHT} color={ACCENT}>Analyzing</Pill>;
    return <Pill bg={RED_BG} color={RED}>Failed</Pill>;
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yy = String(d.getFullYear()).slice(2);
      return `${mm}-${dd}-${yy}`;
    } catch { return iso; }
  };

  const filtered = cases.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.case_name || "").toLowerCase().includes(q) ||
      (c.case_number || "").toLowerCase().includes(q) ||
      (c.settlement_filename || "").toLowerCase().includes(q);
  });

  const thStyle = { padding: "14px 16px", fontSize: 12, fontWeight: 600, color: MUTED, textAlign: "left", borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap" };
  const tdStyle = { padding: "16px 16px", fontSize: 13, color: TEXT_SEC, borderBottom: `1px solid ${BORDER_LIGHT}` };

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Card header */}
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>Case List</span>
          <Pill bg={ACCENT_LIGHT} color={ACCENT}>{cases.length} case{cases.length !== 1 ? "s" : ""}</Pill>
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: DIM, fontSize: 14 }}>&#128269;</span>
          <input
            type="text" placeholder="Search here" value={searchQuery} onChange={e => onSearchChange(e.target.value)}
            style={{ padding: "8px 12px 8px 32px", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, width: 220, outline: "none", color: TEXT, background: WHITE }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: MUTED, fontSize: 13 }}>Loading cases...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>{"\uD83D\uDCC2"}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>
            {cases.length === 0 ? "No cases yet" : "No matching cases"}
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
            {cases.length === 0 ? "Click \"+ New Case Analysis\" above to get started." : "Try a different search term."}
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Case ID <span style={{ color: DIM }}>&#8595;</span></th>
                <th style={thStyle}>Case Name <span style={{ color: DIM }}>&#8595;</span></th>
                <th style={thStyle}>Date <span style={{ color: DIM }}>&#8595;</span></th>
                <th style={thStyle}>Settlement Type <span style={{ color: DIM }}>&#8595;</span></th>
                <th style={thStyle}>Status <span style={{ color: DIM }}>&#8595;</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const clickable = c.analysis_status === "completed";
                return (
                  <tr key={c.id}
                    onClick={() => clickable && onSelectCase(c.id)}
                    style={{ cursor: clickable ? "pointer" : "default", transition: "background .12s" }}
                    onMouseEnter={e => { if (clickable) e.currentTarget.style.background = ACCENT_LIGHT; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 12, color: MUTED }}>{c.case_number || `#${c.id}`}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: TEXT, maxWidth: 320 }}>
                      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.case_name || c.settlement_filename}</div>
                    </td>
                    <td style={{ ...tdStyle, color: MUTED }}>{formatDate(c.created_at)}</td>
                    <td style={tdStyle}>
                      {c.settlement_type ? <Pill bg={c.settlement_type === "Claims-Made" ? AMBER_BG : GREEN_BG} color={c.settlement_type === "Claims-Made" ? AMBER : GREEN}>{c.settlement_type}</Pill> : <span style={{ color: DIM }}>&mdash;</span>}
                    </td>
                    <td style={tdStyle}>{statusPill(c.analysis_status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ── Home Screen ── */
function HomeScreen({ onNewCase, cases, casesLoading, onSelectCase, error }) {
  const [search, setSearch] = useState("");
  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: TEXT, marginBottom: 4 }}>All Cases</h1>
          <p style={{ fontSize: 14, color: MUTED }}>Keep track of all cases and their analysis status.</p>
        </div>
        <button onClick={onNewCase}
          style={{ background: ACCENT, color: WHITE, border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
          + New Case Analysis
        </button>
      </div>

      {error && (
        <div style={{ background: RED_BG, border: "1px solid #FECACA", borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 13, color: RED, display: "flex", alignItems: "center", gap: 8 }}>
          <span>&#9888;</span> <span>{error}</span>
        </div>
      )}

      <CaseTable cases={cases} loading={casesLoading} onSelectCase={onSelectCase} searchQuery={search} onSearchChange={setSearch} />
    </div>
  );
}

/* ── Processing Screen ── */
function ProcessingScreen({ progress, msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 60px)" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
        <Logo size={56} />
        <div style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginTop: 16, marginBottom: 8 }}>Analyzing Documents</div>
        <div style={{ fontSize: 13, color: MUTED, marginBottom: 28 }}>{msg}</div>
        <div style={{ background: BORDER, borderRadius: 99, height: 6, overflow: "hidden", marginBottom: 10 }}>
          <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT}, #7C3AED)`, width: `${progress}%`, transition: "width .5s" }} />
        </div>
        <div style={{ fontSize: 12, color: DIM, fontFamily: "monospace" }}>{progress}%</div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
/* ── StarterQuestions ── */
function StarterQuestions({ data, onSend }) {
  const suggestions = [];
  suggestions.push("What are the key deadlines I need to track?");
  const fund = data.fund_logistics || {};
  if (fund.gross_settlement || fund.net_fund) suggestions.push("Break down how the settlement fund is allocated.");
  const cl = data.claims_logic || {};
  if (cl.claim_tiers?.length) suggestions.push("Explain the different claim tiers and their requirements.");
  const conflicts = data.conflict_audit || [];
  if (conflicts.length) suggestions.push("Summarize the most critical conflicts between settlement and bid.");
  const np = data.notice_plan || {};
  if (np.channels?.length) suggestions.push("What does the notice plan require?");
  const cls = data.class_specs || {};
  if (cls.estimated_size || cls.subclass_details?.length) suggestions.push("Describe the class definition and how members are identified.");
  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Suggested questions</div>
      {suggestions.slice(0, 4).map((q, i) => (
        <div key={i} onClick={() => onSend(q)}
          style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: TEXT_SEC, cursor: "pointer", lineHeight: 1.5, transition: "border-color .15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
        >{q}</div>
      ))}
    </div>
  );
}

/* ── ChatPanel ── */
function ChatPanel({ open, onClose, messages, loading, onSend, data }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) { onSend(input.trim()); setInput(""); }
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", top: 60, right: 0, width: 420, height: "calc(100vh - 60px)", background: WHITE, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", zIndex: 200, boxShadow: "-4px 0 24px rgba(0,0,0,.08)" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{"\uD83E\uDD16"}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Case Assistant</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: MUTED, padding: 4, lineHeight: 1 }}>&times;</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.length === 0 && <StarterQuestions data={data} onSend={onSend} />}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
              ...(m.role === "user"
                ? { background: ACCENT, color: WHITE, borderBottomRightRadius: 4 }
                : { background: BG, color: TEXT_SEC, border: `1px solid ${BORDER}`, borderBottomLeftRadius: 4 }),
            }}>
              {m.content}
              {m.role === "assistant" && loading && i === messages.length - 1 && <span className="chat-cursor" />}
            </div>
          </div>
        ))}
        {loading && messages.length > 0 && messages[messages.length - 1].role === "user" && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 14, borderBottomLeftRadius: 4, padding: "10px 14px", fontSize: 13, color: DIM }}>
              <span className="chat-cursor" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: 12, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this case..."
            rows={1}
            style={{ flex: 1, resize: "none", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }}
            onFocus={e => { e.target.style.borderColor = ACCENT; }}
            onBlur={e => { e.target.style.borderColor = BORDER; }}
          />
          <button
            onClick={() => { if (input.trim() && !loading) { onSend(input.trim()); setInput(""); } }}
            disabled={!input.trim() || loading}
            style={{ background: input.trim() && !loading ? ACCENT : BORDER, color: WHITE, border: "none", borderRadius: 10, width: 38, height: 38, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}
          >{"\u2191"}</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ data, caseId, onBack, filenames }) {
  const [tab, setTab] = useState("timeline");
  const [checks, setChecks] = useState({});
  const [pdfViewer, setPdfViewer] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const toggle = k => setChecks(p => ({ ...p, [k]: !p[k] }));
  const onCite = (c) => setPdfViewer(c);

  const sendChatMessage = async (text) => {
    const userMsg = { role: "user", content: text };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatLoading(true);
    try {
      const resp = await fetch(`/api/cases/${caseId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!resp.ok) throw new Error("Chat request failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setChatMessages(prev => [...prev, { role: "assistant", content: "" }]);
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === "delta") {
            assistantText += payload.text;
            setChatMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "assistant", content: assistantText };
              return updated;
            });
          }
        }
      }
    } catch (err) {
      setChatMessages(prev => [...prev.filter(m => !(m.role === "assistant" && m.content === "")), { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const tl = data.timeline || {};
  const ms = tl.milestones || [];
  const cls = data.class_specs || {};
  const np = data.notice_plan || {};
  const fund = data.fund_logistics || {};
  const cl = data.claims_logic || {};
  const ops = data.operational_checklist || {};
  const conflicts = data.conflict_audit || [];

  const catLabels = { data_intake: "Data Intake", notice_phase: "Notice Phase", claims_processing: "Claims Processing", support: "Support", payment: "Payment", reporting: "Reporting" };
  const allItems = Object.entries(ops).flatMap(([c, items]) => (items || []).map((it, i) => ({ ...it, key: `${c}-${i}` })));
  const done = allItems.filter(i => checks[i.key]).length;

  const sevColor = s => s === "critical" ? { bg: RED_BG, fg: RED } : s === "warning" ? { bg: AMBER_BG, fg: AMBER } : { bg: ACCENT_LIGHT, fg: ACCENT };
  const statColor = s => s === "critical" ? { bg: RED_BG, fg: RED } : s === "upcoming" ? { bg: AMBER_BG, fg: AMBER } : { bg: ACCENT_LIGHT, fg: ACCENT };

  const tabs = [
    { id: "timeline", label: "Timeline" },
    { id: "checklist", label: "Checklist" },
    { id: "audit", label: `Audit${conflicts.length > 0 ? ` (${conflicts.length})` : ""}` },
    { id: "specs", label: "Details" },
    { id: "json", label: "JSON" },
  ];

  // Find next upcoming deadline
  const deadlineFields = [
    ["Notice Deadline", tl.notice_deadline],
    ["Exclusion/Objection", tl.exclusion_objection_deadline],
    ["Claims Deadline", tl.claims_deadline],
    ["Final Approval", tl.final_approval_hearing],
    ["Distribution", tl.distribution_date],
  ];
  const parseDate = (s) => { if (!s || /tbd|not specified/i.test(s)) return null; const d = new Date(s); return isNaN(d) ? null : d; };
  const now = new Date();
  const upcoming = deadlineFields
    .map(([label, val]) => ({ label, val, date: parseDate(val) }))
    .filter(d => d.date && d.date >= now)
    .sort((a, b) => a.date - b.date);
  const nextDeadline = upcoming[0] || null;
  const daysUntil = nextDeadline ? Math.ceil((nextDeadline.date - now) / 86400000) : null;

  return (
    <div>
      {/* Dashboard header — back button only */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: "12px 40px" }}>
        <button onClick={onBack} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 12px", color: MUTED, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          &larr; All Cases
        </button>
      </div>

      {/* Summary header card */}
      <div style={{ background: WHITE, borderBottom: `1px solid ${BORDER}`, padding: "20px 40px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          {/* Row 1: case name + pills */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{data.case_name || "Settlement Dashboard"}</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                {data.case_number ? `Case ${data.case_number}` : ""}
                {data.jurisdiction ? ` \u00B7 ${data.jurisdiction}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginTop: 4 }}>
              <Pill bg={data.settlement_type === "Claims-Made" ? AMBER_BG : GREEN_BG} color={data.settlement_type === "Claims-Made" ? AMBER : GREEN}>{data.settlement_type || "TBD"}</Pill>
              <button onClick={() => setChatOpen(o => !o)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: chatOpen ? ACCENT : WHITE, color: chatOpen ? WHITE : ACCENT, border: `1px solid ${chatOpen ? ACCENT : BORDER}`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}>
                {"\uD83E\uDD16"} Ask AI
              </button>
            </div>
          </div>
          {/* Row 2: stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {/* Gross Settlement */}
            <div style={{ background: BG, borderRadius: 10, padding: "14px 16px", border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Gross Settlement</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>{fund.gross_settlement || "[Not Specified]"}</div>
            </div>
            {/* Net Fund */}
            <div style={{ background: BG, borderRadius: 10, padding: "14px 16px", border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Net Fund</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>{fund.net_fund || "[Not Specified]"}</div>
            </div>
            {/* Class Size */}
            <div style={{ background: BG, borderRadius: 10, padding: "14px 16px", border: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Class Size</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: TEXT }}>{cls.estimated_size || "[Not Specified]"}</div>
            </div>
            {/* Next Deadline */}
            <div style={{ background: nextDeadline ? (daysUntil <= 7 ? RED_BG : daysUntil <= 30 ? AMBER_BG : GREEN_BG) : BG, borderRadius: 10, padding: "14px 16px", border: `1px solid ${nextDeadline ? (daysUntil <= 7 ? "#FECACA" : daysUntil <= 30 ? "#FDE68A" : "#A7F3D0") : BORDER}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Next Deadline</div>
              {nextDeadline ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: daysUntil <= 7 ? RED : daysUntil <= 30 ? AMBER : GREEN }}>{nextDeadline.label}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{nextDeadline.val} &middot; <span style={{ fontWeight: 600, color: daysUntil <= 7 ? RED : daysUntil <= 30 ? AMBER : GREEN }}>{daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}</span></div>
                </div>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, color: DIM }}>No upcoming</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: WHITE, padding: "0 40px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: 2, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "12px 18px", border: "none", borderBottom: tab === t.id ? `2px solid ${ACCENT}` : "2px solid transparent", background: "none", color: tab === t.id ? ACCENT : MUTED, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", transition: "color .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 40px", maxWidth: 1060, margin: "0 auto" }}>

        {/* Summary */}
        {data.summary && (
          <Collapsible title="Case Summary" defaultOpen={false}>
            <Card style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: TEXT_SEC, lineHeight: 1.8 }}>{data.summary}</div>
            </Card>
          </Collapsible>
        )}

        {/* TIMELINE */}
        {tab === "timeline" && <div>
          <SectionHead icon="">Critical Milestone Timeline</SectionHead>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              ["Preliminary Approval", tl.preliminary_approval, "T+0", "preliminary_approval"],
              ["Notice Deadline", tl.notice_deadline, null, "notice_deadline"],
              ["Exclusion/Objection", tl.exclusion_objection_deadline, null, "exclusion_objection_deadline"],
              ["Claims Deadline", tl.claims_deadline, null, "claims_deadline"],
              ["Final Approval", tl.final_approval_hearing, null, "final_approval_hearing"],
              ["Distribution", tl.distribution_date, null, "distribution_date"],
            ].map(([label, val, tag, key], i) => (
              <Card key={i} style={{ padding: 14, marginBottom: 0 }}>
                <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: val?.includes("TBD") ? AMBER : TEXT }}>
                  {val || "[Not Specified]"}
                  <CiteBadge citations={getCitations(data, `timeline.${key}`)} onCiteClick={onCite} />
                </div>
                {tag && <div style={{ marginTop: 6 }}><Pill bg={ACCENT_LIGHT} color={ACCENT}>{tag}</Pill></div>}
              </Card>
            ))}
          </div>
          <Collapsible title="Milestones" defaultOpen={false} right={<span style={{ fontSize: 11, color: DIM }}>{ms.length} items</span>}>
            <Card>
              {ms.length === 0 ? <div style={{ color: DIM, fontSize: 13 }}>No milestones extracted.</div> :
                ms.map((m, i) => {
                  const sc = statColor(m.status);
                  return (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: i < ms.length - 1 ? `1px solid ${BORDER_LIGHT}` : "none", flexWrap: "wrap" }}>
                      <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: ACCENT, minWidth: 60 }}>{m.t_minus || "\u2014"}</div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>
                          {m.label}
                          <CiteBadge citations={getCitations(data, `timeline.milestones[${i}].label`)} onCiteClick={onCite} />
                        </div>
                        <div style={{ fontSize: 11, color: MUTED }}>
                          {m.date}
                          <CiteBadge citations={getCitations(data, `timeline.milestones[${i}].date`)} onCiteClick={onCite} />
                          {m.notes ? ` \u00B7 ${m.notes}` : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: MUTED, minWidth: 80 }}>{m.owner || ""}</div>
                      <Pill bg={sc.bg} color={sc.fg}>{m.status}</Pill>
                    </div>
                  );
                })}
            </Card>
          </Collapsible>
        </div>}

        {/* CHECKLIST */}
        {tab === "checklist" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionHead icon="">Operational Checklist</SectionHead>
            <span style={{ fontSize: 12, color: MUTED }}><strong style={{ color: ACCENT }}>{done}</strong> / {allItems.length}</span>
          </div>
          <div style={{ background: BORDER, borderRadius: 99, height: 5, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${ACCENT}, ${GREEN})`, width: allItems.length ? `${(done / allItems.length) * 100}%` : "0%", transition: "width .3s" }} />
          </div>
          {Object.entries(ops).map(([cat, items]) => {
            if (!items?.length) return null;
            const catDone = items.filter((_, i) => checks[`${cat}-${i}`]).length;
            return (
              <Collapsible key={cat} title={catLabels[cat] || cat} defaultOpen={false} right={<span style={{ fontSize: 11, color: DIM }}>{catDone}/{items.length}</span>}>
                <Card>
                  {items.map((it, i) => {
                    const k = `${cat}-${i}`;
                    const d = checks[k];
                    return (
                      <div key={k} onClick={() => toggle(k)} style={{ display: "flex", gap: 10, padding: "10px 8px", borderRadius: 8, cursor: "pointer", alignItems: "flex-start", transition: "background .1s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = BG; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${d ? ACCENT : BORDER}`, background: d ? ACCENT : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, color: WHITE, marginTop: 1 }}>{d ? "\u2713" : ""}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: d ? DIM : TEXT, textDecoration: d ? "line-through" : "none" }}>
                            {it.task}
                            <CiteBadge citations={getCitations(data, `operational_checklist.${cat}[${i}].task`)} onCiteClick={onCite} />
                          </div>
                          {it.details && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{it.details}</div>}
                          {it.deadline_ref && <div style={{ marginTop: 4 }}><Pill bg={ACCENT_LIGHT} color={ACCENT}>{it.deadline_ref}</Pill></div>}
                        </div>
                      </div>
                    );
                  })}
                </Card>
              </Collapsible>
            );
          })}
        </div>}

        {/* CONFLICT AUDIT */}
        {tab === "audit" && <div>
          <SectionHead icon="">Conflict Audit &mdash; Settlement vs. Bid</SectionHead>
          {conflicts.length === 0 ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>{"\uD83D\uDCC4"}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>No Discrepancies to Show</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4, lineHeight: 1.6 }}>
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
                return <Card key={s} style={{ flex: 1, marginBottom: 0, padding: 14, borderLeft: `3px solid ${sc.fg}` }}><div style={{ fontSize: 22, fontWeight: 700, color: sc.fg }}>{c}</div><div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "capitalize" }}>{s}</div></Card>;
              })}
            </div>
            {conflicts.map((c, i) => {
              const sc = sevColor(c.severity);
              return (
                <Collapsible key={i} title={c.category} defaultOpen={false} right={<Pill bg={sc.bg} color={sc.fg}>{c.severity}</Pill>}>
                  <Card style={{ borderLeft: `3px solid ${sc.fg}` }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div style={{ background: BG, borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", marginBottom: 4 }}>Settlement</div>
                        <div style={{ fontSize: 12, lineHeight: 1.5, color: TEXT_SEC }}>
                          {c.settlement_says}
                          <CiteBadge citations={getCitations(data, `conflict_audit[${i}].settlement_says`)} onCiteClick={onCite} />
                        </div>
                      </div>
                      <div style={{ background: BG, borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: DIM, textTransform: "uppercase", marginBottom: 4 }}>Bid</div>
                        <div style={{ fontSize: 12, lineHeight: 1.5, color: TEXT_SEC }}>
                          {c.bid_says}
                          <CiteBadge citations={getCitations(data, `conflict_audit[${i}].bid_says`)} onCiteClick={onCite} />
                        </div>
                      </div>
                    </div>
                    {c.recommendation && <div style={{ fontSize: 12, color: ACCENT, lineHeight: 1.5 }}><strong>Rec:</strong> {c.recommendation}</div>}
                  </Card>
                </Collapsible>
              );
            })}
          </>}
        </div>}

        {/* CASE DETAILS */}
        {tab === "specs" && <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            <Collapsible title="Class Specs" defaultOpen={true}>
              <Card>
                {[["Est. Size", cls.estimated_size, "estimated_size"], ["Subclasses", cls.subclasses, "subclasses"], ["Data Format", cls.data_format, "data_format"], ["Source", cls.data_source, "data_source"]].map(([l, v, key], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 13 }}>
                    <span style={{ color: MUTED }}>{l}</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>
                      {v ?? "[N/S]"}
                      <CiteBadge citations={getCitations(data, `class_specs.${key}`)} onCiteClick={onCite} />
                    </span>
                  </div>
                ))}
              </Card>
            </Collapsible>
            <Collapsible title="Notice Plan" defaultOpen={false}>
              <Card>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>{(np.channels || []).map((c, i) => <Pill key={i} bg={ACCENT_LIGHT} color={ACCENT}>{c}</Pill>)}</div>
                {[["Skip Tracing", np.skip_tracing, "skip_tracing"], ["URL", np.dedicated_url, "dedicated_url"], ["Toll-Free", np.toll_free_number, "toll_free_number"]].map(([l, v, key], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 13 }}>
                    <span style={{ color: MUTED }}>{l}</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>
                      {v || "TBD"}
                      <CiteBadge citations={getCitations(data, `notice_plan.${key}`)} onCiteClick={onCite} />
                    </span>
                  </div>
                ))}
                {np.languages?.length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 5, flexWrap: "wrap" }}>{np.languages.map((l, i) => <Pill key={i} bg={ACCENT_LIGHT} color={ACCENT}>{l}</Pill>)}</div>}
              </Card>
            </Collapsible>
            <Collapsible title="Fund Logistics" defaultOpen={false}>
              <Card>
                {[["Gross", fund.gross_settlement, "gross_settlement"], ["Admin Cap", fund.admin_cap, "admin_cap"], ["Atty Fees", fund.attorney_fees, "attorney_fees"], ["Net Fund", fund.net_fund, "net_fund"], ["QSF", fund.qsf_required ? "Yes" : "No", "qsf_required"]].map(([l, v, key], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 13 }}>
                    <span style={{ color: MUTED }}>{l}</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>
                      {v ?? "[N/S]"}
                      <CiteBadge citations={getCitations(data, `fund_logistics.${key}`)} onCiteClick={onCite} />
                    </span>
                  </div>
                ))}
                {fund.payment_methods?.length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 5 }}>{fund.payment_methods.map((m, i) => <Pill key={i} bg={GREEN_BG} color={GREEN}>{m}</Pill>)}</div>}
              </Card>
            </Collapsible>
            <Collapsible title="Claims Logic" defaultOpen={false}>
              <Card>
                {[["Type", cl.type, "type"], ["Form Required", cl.form_required ? "Yes" : "No", "form_required"], ["Proof", cl.proof_requirements, "proof_requirements"]].map(([l, v, key], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDER_LIGHT}`, fontSize: 13 }}>
                    <span style={{ color: MUTED }}>{l}</span>
                    <span style={{ fontWeight: 600, color: TEXT, textAlign: "right", maxWidth: "60%" }}>
                      {v ?? "[N/S]"}
                      <CiteBadge citations={getCitations(data, `claims_logic.${key}`)} onCiteClick={onCite} />
                    </span>
                  </div>
                ))}
                {cl.claim_tiers?.length > 0 && <div style={{ marginTop: 10 }}>{cl.claim_tiers.map((t, i) => (
                  <div key={i} style={{ background: BG, borderRadius: 8, padding: 10, marginBottom: 5 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{t.tier} &mdash; {t.amount}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{t.requirements}</div>
                  </div>
                ))}</div>}
              </Card>
            </Collapsible>
          </div>
        </div>}

        {/* JSON */}
        {tab === "json" && <div>
          <SectionHead icon="">Raw JSON</SectionHead>
          <Card>
            <pre style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.6, color: TEXT_SEC, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 500, overflow: "auto", background: BG, borderRadius: 8, padding: 16 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </Card>
        </div>}
      </div>

      <PdfViewerModal
        open={!!pdfViewer}
        onClose={() => setPdfViewer(null)}
        caseId={caseId}
        citation={pdfViewer}
        filenames={filenames}
      />

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        loading={chatLoading}
        onSend={sendChatMessage}
        data={data}
      />

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .chat-cursor { display: inline-block; width: 2px; height: 14px; background: ${ACCENT}; margin-left: 2px; vertical-align: text-bottom; animation: blink 0.8s step-end infinite; }
      `}</style>
    </div>
  );
}

/* ── MAIN APP ── */
export default function App() {
  const [step, setStep] = useState("home");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchCases = async () => {
    setCasesLoading(true);
    try {
      const resp = await fetch("/api/cases");
      if (resp.ok) {
        const data = await resp.json();
        setCases(data);
      }
    } catch {
      // silently fail
    } finally {
      setCasesLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const selectCase = async (caseId) => {
    setStep("processing");
    setProgress(50);
    setProgressMsg("Loading case data\u2026");
    try {
      const resp = await fetch(`/api/cases/${caseId}`);
      if (!resp.ok) throw new Error("Failed to load case");
      const data = await resp.json();
      if (data.analysis_status !== "completed" || !data.analysis_json) {
        throw new Error("Case analysis not available");
      }
      setResult({ ...data.analysis_json, _hasBid: data.has_bid, _settlementFilename: data.settlement_filename, _bidFilename: data.bid_filename });
      setActiveCaseId(caseId);
      setProgress(100);
      setProgressMsg("Done!");
      setTimeout(() => setStep("dashboard"), 200);
    } catch (err) {
      setError(err.message);
      setStep("home");
    }
  };

  const goHome = () => {
    setStep("home");
    setResult(null);
    setActiveCaseId(null);
    setError(null);
    fetchCases();
  };

  const process = async (files) => {
    const hasBid = files.length > 1;
    setStep("processing"); setError(null); setProgress(10); setProgressMsg("Uploading documents\u2026");
    try {
      const form = new FormData();
      files.forEach(f => form.append("files", f));

      const parseResp = async (resp, fallbackMsg) => {
        const text = await resp.text();
        try { return JSON.parse(text); } catch { throw new Error(fallbackMsg + ": " + text.slice(0, 200)); }
      };

      const uploadResp = await fetch("/api/cases/upload", { method: "POST", body: form });
      if (!uploadResp.ok) {
        const err = await parseResp(uploadResp, "Upload failed");
        throw new Error(err.detail || "Upload failed");
      }
      const uploadData = await parseResp(uploadResp, "Upload failed");
      const id = uploadData.id;

      setProgress(30); setProgressMsg(hasBid ? "AI cross-referencing Settlement vs. Bid\u2026" : "AI analyzing Settlement Agreement\u2026");

      const analyzeResp = await fetch(`/api/cases/${id}/analyze`, { method: "POST" });
      if (!analyzeResp.ok) {
        const err = await parseResp(analyzeResp, "Analysis failed");
        throw new Error(err.detail || "Analysis failed");
      }
      const analyzeData = await parseResp(analyzeResp, "Analysis failed");

      setProgress(90); setProgressMsg("Parsing analysis\u2026");

      if (analyzeData.analysis_status !== "completed" || !analyzeData.analysis_json) {
        throw new Error(analyzeData.analysis_error || "Analysis did not complete");
      }

      setResult({ ...analyzeData.analysis_json, _hasBid: hasBid, _settlementFilename: uploadData.settlement_filename, _bidFilename: uploadData.bid_filename });
      setActiveCaseId(id);
      setProgress(100); setProgressMsg("Done!");
      setTimeout(() => setStep("dashboard"), 300);
    } catch (err) {
      setError(err.message); setStep("home");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: TEXT }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <NavBar activePage={step === "home" ? "cases" : ""} onNavigate={(id) => { if (id === "cases") goHome(); }} />
      {step === "home" && <HomeScreen onNewCase={() => setShowUpload(true)} error={error} cases={cases} casesLoading={casesLoading} onSelectCase={selectCase} />}
      {step === "processing" && <ProcessingScreen progress={progress} msg={progressMsg} />}
      {step === "dashboard" && <Dashboard data={result} caseId={activeCaseId} onBack={goHome} filenames={{ settlement: result?._settlementFilename, bid: result?._bidFilename }} />}
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} onProcess={process} error={error} />
    </div>
  );
}
