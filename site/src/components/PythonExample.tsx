import { useEffect, useId, useRef, useState } from 'react';
import { tokenizePython } from '../lesson-visuals/pythonTokens';
import type { PythonStepVisual } from '../lesson-visuals/types';

export function PythonExample({ visual }: { visual: Omit<PythonStepVisual, 'kind' | 'explanation'> & { explanation?: string } }) {
  const [status, setStatus] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const labelId = useId();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timeout.current); };
  }, []);

  async function copyCode() {
    clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(visual.code);
      if (!mounted.current) return;
      setStatus('Скопійовано');
      timeout.current = setTimeout(() => setStatus(''), 2000);
    } catch {
      if (mounted.current) setStatus('Не вдалося скопіювати. Виділи код і скопіюй вручну.');
    }
  }

  return <section className="python-example" aria-labelledby={labelId}>
    <div className="visual-toolbar">
      <p id={labelId}>{visual.label}</p>
      <button className="visual-button" type="button" onClick={copyCode}>{status === 'Скопійовано' ? 'Скопійовано' : 'Копіювати код'}</button>
    </div>
    <pre tabIndex={0} aria-label={visual.label}><code>{tokenizePython(visual.code).map(({ type, value }, index) => <span key={index} data-token={type}>{value}</span>)}</code></pre>
    <p className="visual-copy-status" role="status" aria-live="polite">{status}</p>
    {visual.explanation && <p>{visual.explanation}</p>}
  </section>;
}
