/** Escapes text for safe use inside HTML. */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** Design tokens shared by every sandbox page (light + dark). */
const STYLES = `
:root {
  --bg: #f4f6f8; --surface: #ffffff; --ink: #18202a; --muted: #5a6573; --line: #dbe1e7;
  --accent: #2357c6; --accent-soft: #e6edfb; --ok: #1d7a43; --bad: #b42318; --skip: #8a6100; --code: #edf0f3;
  --font: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root { --bg: #11161c; --surface: #19202a; --ink: #e3e9f0; --muted: #98a4b3; --line: #2a3442;
    --accent: #7aa2ff; --accent-soft: #1d2a44; --ok: #5ccb8a; --bad: #f2877c; --skip: #e0b04f; --code: #212a36; color-scheme: dark; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font); font-size: 15px; line-height: 1.5; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 24px 16px 60px; display: grid; gap: 22px; }
h1 { font-size: 24px; margin: 0; } h2 { font-size: 17px; margin: 0; } p { margin: 0; }
.muted { color: var(--muted); }
.eyebrow { font-size: 12px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 16px; display: grid; gap: 12px; min-width: 0; }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
code, .mono { font-family: var(--mono); font-size: 13px; }
code { background: var(--code); padding: 1px 6px; border-radius: 4px; overflow-wrap: anywhere; }
.btn { font: 600 14px var(--font); border: 1px solid var(--line); background: var(--surface); color: var(--ink); border-radius: 7px; padding: 7px 13px; cursor: pointer; text-decoration: none; display: inline-flex; gap: 6px; align-items: center; }
.btn:hover { border-color: var(--accent); color: var(--accent); }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.btn.danger:hover { border-color: var(--bad); color: var(--bad); }
.btn:disabled { opacity: .5; cursor: wait; }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.table-wrap { overflow-x: auto; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.pill { display: inline-block; font: 600 12px var(--mono); padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.pass { color: var(--ok); background: color-mix(in srgb, var(--ok) 13%, transparent); }
.fail { color: var(--bad); background: color-mix(in srgb, var(--bad) 13%, transparent); }
.skipped, .not-run { color: var(--skip); background: color-mix(in srgb, var(--skip) 14%, transparent); }
.kv { display: grid; grid-template-columns: max-content 1fr; gap: 6px 14px; font-size: 14px; }
.kv dt { color: var(--muted); } .kv dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
`;

export function page(title: string, body: string, script = ''): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>${STYLES}</style></head>
<body><div class="wrap">${body}</div>${script ? `<script>${script}</script>` : ''}</body></html>`;
}
