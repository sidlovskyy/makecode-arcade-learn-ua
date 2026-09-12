import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function VisualLightbox({ children, onClose }: { children: ReactNode; onClose(): void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    let cancelled = false;
    async function revealTarget() {
      const region = scrollRef.current;
      const image = region?.querySelector('img');
      if (!region || !image) return;
      try { await image.decode?.(); } catch { return; }
      if (cancelled) return;
      const target = region.querySelector('.visual-focus')?.getBoundingClientRect();
      if (!target) return;
      const viewport = region.getBoundingClientRect();
      // Oversized targets start at their leading edge; smaller ones center.
      region.scrollLeft += target.left - viewport.left - Math.max(0, (region.clientWidth - target.width) / 2);
      region.scrollTop += target.top - viewport.top - Math.max(0, (region.clientHeight - target.height) / 2);
    }
    void revealTarget();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    function keepFocus(event: FocusEvent) {
      if (event.target instanceof Node && !dialogRef.current?.contains(event.target)) closeRef.current?.focus();
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]');
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', keepFocus);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', keepFocus);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div className="visual-lightbox-backdrop">
      <div ref={dialogRef} className="visual-lightbox" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="visual-toolbar">
          <h3 id={titleId}>Розглянь крупніше</h3>
          <button ref={closeRef} className="visual-button" type="button" onClick={onClose}>Закрити</button>
        </div>
        <div ref={scrollRef} className="visual-lightbox__scroll" tabIndex={0} role="region" aria-label="Збільшене зображення; прокручуй, щоб розглянути деталі">
          {children}
        </div>
      </div>
    </div>, document.body,
  );
}
