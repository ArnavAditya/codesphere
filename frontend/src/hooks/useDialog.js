import { useEffect, useRef } from 'react';

// Keep keyboard focus inside a modal and return it to the trigger on close.
export default function useDialog(open, onClose) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const dialog = [...document.querySelectorAll('[role="dialog"]')].at(-1);
    if (!dialog) return;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled):not([hidden]), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(element => element.getClientRects().length);
    if (!dialog.contains(document.activeElement)) focusable()[0]?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);
}
