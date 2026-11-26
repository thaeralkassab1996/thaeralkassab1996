// Toolkit: skills from the CV, grouped the way the portfolio groups them. The AI row is tinted
// because it is the specialty.
import { FONT_SANS } from '../lib/theme.mjs';
import { esc, svgDoc, textWidth } from '../lib/svg.mjs';

export const TOOLKIT = [
  { group: 'Languages', items: ['Python', 'TypeScript', 'SQL'] },
  {
    group: 'AI & LLMs',
    accent: true,
    items: ['OpenAI', 'Gemini', 'RAG', 'Embeddings & semantic search', 'Agentic AI & tool calling', 'Model evaluation', 'LiveKit'],
  },
  { group: 'Frameworks', items: ['LangChain', 'LangGraph', 'LlamaIndex'] },
  { group: 'ML & research', items: ['PyTorch', 'PyTorch Geometric', 'scikit-learn', 'SHAP', 'MLflow'] },
  { group: 'Backend & cloud', items: ['FastAPI', 'PostgreSQL', 'Supabase', 'Redis', 'Docker', 'GitHub Actions', 'AWS'] },
];

const W = 1000;
const LABEL_W = 190;
const CHIP_H = 34;
const CHIP_GAP = 8;
const LINE_GAP = 8;
const ROW_PAD = 14;
const SIZE = 15;
const PAD_X = 14;

function chip(text, x, y, w, accent, t) {
  const box = accent
    ? `<rect x="${x}" y="${y}" width="${w}" height="${CHIP_H}" rx="8" fill="${t.blueSoft}"/>`
    : `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${CHIP_H - 1}" rx="7.5" fill="none" stroke="${t.ruleStrong}"/>`;
  return `${box}<text x="${x + w / 2}" y="${y + CHIP_H / 2 + 5}" text-anchor="middle" font-size="${SIZE}" fill="${accent ? t.blue : t.ink}">${esc(text)}</text>`;
}

export function renderToolkit(t) {
  let y = 52;
  const rows = TOOLKIT.map((row, r) => {
    const top = y;
    let x = LABEL_W;
    let lineY = top + ROW_PAD;
    const chips = row.items.map((item) => {
      const w = Math.ceil(textWidth(item, SIZE) + PAD_X * 2);
      if (x + w > W && x > LABEL_W) {
        x = LABEL_W;
        lineY += CHIP_H + LINE_GAP;
      }
      const out = chip(item, x, lineY, w, row.accent, t);
      x += w + CHIP_GAP;
      return out;
    });
    y = lineY + CHIP_H + ROW_PAD;
    const rule = `<path d="M0 ${top}H${W}" stroke="${t.rule}"/>`;
    const label = `<text x="0" y="${top + ROW_PAD + CHIP_H / 2 + 5}" font-size="15" font-weight="600" fill="${t.slate}">${esc(row.group)}</text>`;
    return `<g class="row" style="animation-delay:${r * 90}ms">${rule}${label}${chips.join('')}</g>`;
  });
  const height = Math.ceil(y + 1);
  const css = `
text { font-family: ${FONT_SANS}; }
.row { animation: rise .5s cubic-bezier(.2, .7, .2, 1) backwards; }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }`;
  const body = `<text x="0" y="26" font-size="19" font-weight="600" fill="${t.ink}">Toolkit</text>\n${rows.join('\n')}`;
  return svgDoc({ width: W, height, title: 'Toolkit: languages, AI and LLMs, frameworks, ML and research, backend and cloud', css, body });
}
