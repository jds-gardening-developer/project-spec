import { useState } from 'react';
import './CopyButton.css';

/**
 * CopyButton — small button that copies a string to the clipboard via
 * navigator.clipboard.writeText. Shows a checkmark for 1500ms after success.
 *
 * D-14: always visible (no hover-only). D-15: 1500ms feedback. D-16: silent on missing API.
 *
 * Props:
 *   text: string — the content to copy (the <pre>'s textContent)
 */
const FEEDBACK_MS = 1500;

let _warned = false;
function warnUnavailableOnce() {
  if (_warned) return;
  _warned = true;
  // eslint-disable-next-line no-console
  console.warn('[spec-viewer] clipboard API unavailable');
}

export function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const onClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      warnUnavailableOnce();
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), FEEDBACK_MS);
    } catch (err) {
      // Browser refused (focus constraints, permissions, etc). D-16 says silent + warn.
      warnUnavailableOnce();
    }
  };

  return (
    <button
      type="button"
      className={'copy-button' + (copied ? ' copy-button--copied' : '')}
      onClick={onClick}
      aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
}

/* Inline SVG icons — no extra dependency. Stroke-currentColor so CSS custom properties win. */

function ClipboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="4" y="2" width="8" height="2" rx="0.5" fill="currentColor" />
      <rect x="3" y="3" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8 L7 12 L13 4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
