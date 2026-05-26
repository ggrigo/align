// app.jsx — align rating form, hi-fi interactive prototype
// One-claim-at-a-time hybrid: narrow rail of all claims (color-coded by rating),
// large focused claim in the centre, review summary + export on the right.
//
// Tweakable: aesthetic preset (editorial/modern/terminal), rating-button style,
// density, accent color. Keyboard-first: 1-6 rate, ↑↓ navigate, N notes, E expand.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Rating taxonomy ──────────────────────────────────────────────────────────
const RATINGS = ['correct', 'wrong', 'almost', 'nuance', 'unknown', 'skip'];
const R_META = {
  correct: { label: 'Correct',      emoji: '✓', letter: 'C', key: '1', hue: 145 },
  wrong:   { label: 'Wrong',        emoji: '✕', letter: 'W', key: '2', hue: 25  },
  almost:  { label: 'Almost',       emoji: '◐', letter: 'A', key: '3', hue: 75  },
  nuance:  { label: 'Nuance',       emoji: '◍', letter: 'N', key: '4', hue: 260 },
  unknown: { label: "Can't verify", emoji: '?', letter: '?', key: '5', hue: 310 },
  skip:    { label: 'Skip',         emoji: '–', letter: 'S', key: '6', hue: 100 },
};
const ICON_GLYPH = {
  calendar: '◷', gmail: '✉', slack: '#', fireflies: '◉',
  drive: '▤', fabric: '◇', rhythm: '♪', briefing: '☱',
};

// ── Sidebar: tight rows, one per claim ──────────────────────────────────────
function ClaimRow({ claim, idx, focused, onFocus }) {
  const rating = claim.rating;
  return (
    <button
      className={'row' + (focused ? ' row--focused' : '') + (rating ? ' row--rated row--' + rating : '')}
      onClick={() => onFocus(idx)}
      data-screen-label={`row-${claim.id}`}
    >
      <span className="row__num">{String(idx + 1).padStart(2, '0')}</span>
      <span className="row__icon" aria-hidden>{ICON_GLYPH[claim.icon] || '·'}</span>
      <span className="row__text">{claim.text}</span>
      <span className="row__dot" aria-hidden>
        {rating ? R_META[rating].emoji : ''}
      </span>
    </button>
  );
}

// ── Focused claim: large headline + source quote + meta + controls ──────────
function FocusedClaim({ claim, idx, total, ratingStyle, onRate, onNotes, notesRef }) {
  const showNotes = claim.rating && claim.rating !== 'correct' && claim.rating !== 'skip';
  return (
    <article className="focused" data-screen-label="focused-claim">
      <header className="focused__hd">
        <span className="focused__counter">
          <span className="num">{String(idx + 1).padStart(2, '0')}</span>
          <span className="sep">/</span>
          <span className="tot">{String(total).padStart(2, '0')}</span>
        </span>
        <span className="focused__src">
          <span className="focused__src-icon" aria-hidden>{ICON_GLYPH[claim.icon] || '·'}</span>
          {claim.source}
          {claim.time && <span className="focused__time">· {claim.time}</span>}
        </span>
        {claim.verifiable === false && (
          <span className="badge-machine" title="Machine-only evidence — pre-rated as can't verify.">machine-only</span>
        )}
      </header>

      <h2 className="focused__claim">{claim.text}</h2>

      {claim.desc && <p className="focused__desc">{claim.desc}</p>}

      {claim.detail && (
        <pre className="focused__detail">{claim.detail}</pre>
      )}

      {((claim.categories && claim.categories.length) || (claim.files && claim.files.length)) && (
        <div className="focused__tags">
          {(claim.categories || []).map(c => <span key={c} className="tag tag--cat">{c}</span>)}
          {(claim.files || []).map(f => <span key={f} className="tag tag--file">{f}</span>)}
          {claim.link && <a className="tag tag--link" href={claim.link} target="_blank" rel="noopener noreferrer">open source ↗</a>}
        </div>
      )}

      <RatingBar style={ratingStyle} value={claim.rating} onChange={onRate} />

      <div className={'notes' + (showNotes ? ' notes--open' : '')}>
        <label className="notes__lbl" htmlFor="notes-ta">
          {claim.rating === 'wrong' && "What's the real story?"}
          {claim.rating === 'almost' && "What's missing or off?"}
          {claim.rating === 'nuance' && 'What nuance is missing?'}
          {!['wrong','almost','nuance'].includes(claim.rating) && 'Notes'}
        </label>
        <textarea
          id="notes-ta"
          ref={notesRef}
          className="notes__ta"
          value={claim.notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Add reality, evidence, or context…"
        />
      </div>
    </article>
  );
}

// ── Rating bar — three style variants ───────────────────────────────────────
function RatingBar({ style, value, onChange }) {
  return (
    <div className={'rate rate--' + style} role="radiogroup" aria-label="Rate this claim">
      {RATINGS.map(r => {
        const meta = R_META[r];
        const sel = value === r;
        return (
          <button
            key={r}
            className={'rate__btn' + (sel ? ' rate__btn--sel rate__btn--' + r : '')}
            onClick={() => onChange(r)}
            role="radio"
            aria-checked={sel}
            title={meta.label + ' (' + meta.key + ')'}
          >
            <span className="rate__key" aria-hidden>{meta.key}</span>
            {style === 'labeled' && <span className="rate__lbl">{meta.label}</span>}
            {style === 'emoji'   && <span className="rate__glyph">{meta.emoji}</span>}
            {style === 'letter'  && <span className="rate__glyph rate__glyph--letter">{meta.letter}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Right rail: review summary, missing items, export ───────────────────────
function ReviewRail({ claims, missing, setMissing, onExport, accuracy, counts, rated }) {
  return (
    <aside className="rail" data-screen-label="review-rail">
      <div className="rail__hd">
        <span className="rail__eyebrow">Review</span>
        <span className="rail__big">{accuracy}<span className="rail__pct">%</span></span>
        <span className="rail__sub">accuracy across {rated} rated</span>
      </div>

      <div className="rail__progress">
        {RATINGS.map(r => counts[r] > 0 && (
          <span key={r} className={'rail__seg rail__seg--' + r}
                style={{ flex: counts[r] }} title={`${R_META[r].label}: ${counts[r]}`} />
        ))}
        {(claims.length - rated) > 0 && (
          <span className="rail__seg rail__seg--unrated"
                style={{ flex: claims.length - rated }} title={`Unrated: ${claims.length - rated}`} />
        )}
      </div>

      <dl className="rail__stats">
        {RATINGS.map(r => (
          <div key={r} className={'rail__stat rail__stat--' + r + (counts[r] === 0 ? ' is-empty' : '')}>
            <dt>{R_META[r].label}</dt>
            <dd>{counts[r]}</dd>
          </div>
        ))}
      </dl>

      <div className="rail__missing">
        <label className="rail__eyebrow" htmlFor="missing">Missing — not captured</label>
        <textarea
          id="missing"
          className="rail__ta"
          value={missing}
          onChange={(e) => setMissing(e.target.value)}
          placeholder="What happened today that no source caught?"
        />
      </div>

      <button className="rail__export" onClick={onExport}>
        <span>Download align.md</span>
        <span className="rail__export-icon" aria-hidden>↓</span>
      </button>

      <ul className="rail__kbd">
        <li><kbd>↑</kbd><kbd>↓</kbd> <span>navigate</span></li>
        <li><kbd>1</kbd>–<kbd>6</kbd> <span>rate</span></li>
        <li><kbd>N</kbd> <span>notes</span></li>
        <li><kbd>E</kbd> <span>expand detail</span></li>
      </ul>
    </aside>
  );
}

// ── Tweaks UI ───────────────────────────────────────────────────────────────
function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Aesthetic" />
      <TweakRadio label="Preset" value={t.preset}
        options={['editorial', 'modern', 'terminal']}
        onChange={(v) => setTweak('preset', v)} />
      <TweakColor label="Accent"
        value={t.accent}
        options={t.preset === 'terminal'
          ? ['#c4f04a', '#7ce0c0', '#f0c14a', '#e89cc4']
          : t.preset === 'modern'
            ? ['#3d5bdb', '#0f766e', '#b54848', '#7a3aa1']
            : ['#b56a3e', '#3f6b54', '#3a5a8a', '#7a3a52']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakSection label="Interaction" />
      <TweakRadio label="Rate buttons" value={t.ratingStyle}
        options={['labeled', 'emoji', 'letter']}
        onChange={(v) => setTweak('ratingStyle', v)} />
      <TweakRadio label="Density" value={t.density}
        options={['comfy', 'compact']}
        onChange={(v) => setTweak('density', v)} />
      <TweakToggle label="Auto-advance after rate" value={t.autoAdvance}
        onChange={(v) => setTweak('autoAdvance', v)} />
    </TweaksPanel>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  const [claims, setClaims] = useState(() =>
    window.MOCK_CLAIMS.map(c => ({
      ...c,
      rating: c.verifiable === false ? 'unknown' : null,
      notes: '',
    }))
  );
  const [focused, setFocused] = useState(0);
  const [missing, setMissing] = useState('');
  const notesRef = useRef(null);
  const focusedRef = useRef(null);

  // Apply preset + accent to root via CSS variables
  useEffect(() => {
    document.documentElement.dataset.preset = t.preset;
    document.documentElement.dataset.density = t.density;
    document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.preset, t.density, t.accent]);

  // Counts + accuracy
  const { counts, rated, accuracy } = useMemo(() => {
    const c = { correct: 0, wrong: 0, almost: 0, nuance: 0, unknown: 0, skip: 0 };
    claims.forEach(cl => { if (cl.rating) c[cl.rating]++; });
    const r = Object.values(c).reduce((a, b) => a + b, 0);
    const scoreable = r - c.skip - c.unknown;
    const acc = scoreable > 0 ? Math.round(c.correct / scoreable * 100) : null;
    return { counts: c, rated: r, accuracy: acc !== null ? acc : '–' };
  }, [claims]);

  // Rate handler — toggles, auto-advances to next unrated
  const rate = useCallback((ratingOrNull, idx) => {
    const i = idx ?? focused;
    setClaims(prev => prev.map((c, j) => j === i
      ? { ...c, rating: c.rating === ratingOrNull ? null : ratingOrNull }
      : c));
    if (ratingOrNull && t.autoAdvance) {
      // schedule advance — find next unrated after current
      setTimeout(() => {
        setClaims(curr => {
          const start = (i + 1) % curr.length;
          for (let step = 0; step < curr.length; step++) {
            const k = (start + step) % curr.length;
            if (!curr[k].rating) { setFocused(k); return curr; }
          }
          // none unrated — just go next
          setFocused(Math.min(i + 1, curr.length - 1));
          return curr;
        });
      }, 120);
    }
  }, [focused, t.autoAdvance]);

  const setNotes = useCallback((v) => {
    setClaims(prev => prev.map((c, j) => j === focused ? { ...c, notes: v } : c));
  }, [focused]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') {
        if (e.key === 'Escape') { e.target.blur(); }
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const ratingKey = RATINGS.find(r => R_META[r].key === e.key);
      if (ratingKey) { e.preventDefault(); rate(ratingKey); return; }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        setFocused(f => Math.min(f + 1, claims.length - 1));
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        setFocused(f => Math.max(f - 1, 0));
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        notesRef.current && notesRef.current.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rate, claims.length]);

  // Scroll focused row into view in sidebar
  useEffect(() => {
    const row = document.getElementById('row-' + focused);
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (focusedRef.current) focusedRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  }, [focused]);

  // Export — same shape as original align template
  const exportMd = useCallback(() => {
    const statusMap = {
      correct: '✅ Correct', wrong: '❌ Wrong', almost: '🔶 Almost',
      nuance: '🔷 Needs nuance', unknown: "🤷 Can't verify", skip: '⬜ Skipped',
    };
    let md = '# Alignment Feedback — 2026-05-24\n';
    md += 'Context: rhythm\nSource: daily-rhythm\nGenerated: ' + new Date().toLocaleString('en-GB') + '\n\n';
    md += '## Summary\n| Status | Count |\n|--------|-------|\n';
    Object.entries(counts).forEach(([k, v]) => { if (v > 0) md += '| ' + statusMap[k] + ' | ' + v + ' |\n'; });
    if (claims.length - rated > 0) md += '| ⏳ Unrated | ' + (claims.length - rated) + ' |\n';
    md += '\n';
    const actionable = claims.filter(c => ['wrong','almost','nuance'].includes(c.rating));
    if (actionable.length) {
      md += '## Corrections Required\n\n';
      actionable.forEach(c => {
        md += '### Claim ' + c.id + ': ' + statusMap[c.rating] + '\n';
        md += '> ' + c.text + '\n> *' + c.source + '*\n\n';
        md += '**Reality:** ' + (c.notes || '*(no notes provided)*') + '\n\n';
      });
    }
    if (missing.trim()) {
      md += '## Missing — Not Captured\n\n';
      missing.split('\n').filter(l => l.trim()).forEach(l => md += '- ' + l.trim() + '\n');
    }
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'align-rhythm-2026-05-24.md';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [claims, counts, rated, missing]);

  const cur = claims[focused];

  return (
    <div className="app">
      {/* Top bar */}
      <header className="topbar" data-screen-label="topbar">
        <div className="topbar__brand">
          <span className="topbar__mark" aria-hidden>◴</span>
          <span className="topbar__name">align</span>
          <span className="topbar__ctx">rhythm</span>
        </div>
        <div className="topbar__meta">
          <span className="topbar__date">Sun, 24 May 2026</span>
          <span className="topbar__sep">·</span>
          <span className="topbar__count">{claims.length} claims</span>
          <span className="topbar__sep">·</span>
          <span className="topbar__rated"><b>{rated}</b>/{claims.length} rated</span>
          {accuracy !== '–' && (
            <>
              <span className="topbar__sep">·</span>
              <span className="topbar__acc"><b>{accuracy}%</b> accuracy</span>
            </>
          )}
        </div>
        <button className="topbar__dl" onClick={exportMd}>
          <span>Export</span><span aria-hidden>↓</span>
        </button>
      </header>

      {/* 3-col body */}
      <div className="body">
        {/* Sidebar */}
        <nav className="sidebar" data-screen-label="sidebar">
          <div className="sidebar__hd">
            <span className="sidebar__eyebrow">Claims</span>
            <span className="sidebar__count">{rated}/{claims.length}</span>
          </div>
          <div className="sidebar__list">
            {claims.map((c, i) => (
              <div id={'row-' + i} key={c.id}>
                <ClaimRow claim={c} idx={i} focused={i === focused} onFocus={setFocused} />
              </div>
            ))}
          </div>
        </nav>

        {/* Focused claim */}
        <main className="main" ref={focusedRef}>
          {cur && (
            <FocusedClaim
              claim={cur}
              idx={focused}
              total={claims.length}
              ratingStyle={t.ratingStyle}
              onRate={(r) => rate(r)}
              onNotes={setNotes}
              notesRef={notesRef}
            />
          )}
          <nav className="footnav">
            <button className="footnav__btn" onClick={() => setFocused(f => Math.max(0, f - 1))} disabled={focused === 0}>
              <span aria-hidden>←</span> previous
            </button>
            <span className="footnav__hint">
              {claims[focused]?.rating
                ? <>rated <b>{R_META[claims[focused].rating].label.toLowerCase()}</b></>
                : 'press 1–6 to rate'}
            </span>
            <button className="footnav__btn" onClick={() => setFocused(f => Math.min(claims.length - 1, f + 1))} disabled={focused === claims.length - 1}>
              next <span aria-hidden>→</span>
            </button>
          </nav>
        </main>

        {/* Right rail */}
        <ReviewRail
          claims={claims}
          missing={missing} setMissing={setMissing}
          onExport={exportMd}
          accuracy={accuracy}
          counts={counts}
          rated={rated}
        />
      </div>

      <TweaksUI t={t} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
