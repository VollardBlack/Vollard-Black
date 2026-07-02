*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg: #0e0c09;
  --surface: #16130e;
  --surface-raised: #1c1811;
  --line: rgba(184, 144, 44, 0.28);
  --text: #f5f0e8;
  --muted: #a89a83;
  --gold: #b8902c;
  --gold-bright: #e0b563;
  --error: #c0524a;
  --live: #6f9c6a;
}

html, body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Sans', -apple-system, sans-serif;
  min-height: 100%;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(184, 144, 44, 0.3); border-radius: 2px; }

input, select, textarea, button { font-family: inherit; }
a { color: inherit; text-decoration: none; }

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--gold-bright);
}

.serif {
  font-family: 'Fraunces', serif;
}
