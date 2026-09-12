import { useId, useState } from 'react';
import { lessonVisualAssets } from '../lesson-visuals/generated-assets';
import type { LessonVisualAssetRegistry, NormalizedRect } from '../lesson-visuals/types';
import { VisualLightbox } from './VisualLightbox';

interface VisualFigureProps {
  assetId: string;
  kind: 'blocks' | 'editor';
  alt: string;
  focus: NormalizedRect;
  explanation?: string;
  eager?: boolean;
  action?: 'verify';
}

export function VisualFigure({ assetId, kind, alt, focus, explanation, eager = false, action }: VisualFigureProps) {
  const [failedAsset, setFailedAsset] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const captionId = useId();
  const registry: LessonVisualAssetRegistry = lessonVisualAssets;
  const asset = Object.hasOwn(registry, assetId) ? registry[assetId] : undefined;
  const available = asset?.kind === kind && failedAsset !== assetId;

  function content(enlarged = false) {
    return <>
      {available ? (
        <div className={`visual-image visual-image--${kind}${enlarged ? ' visual-image--enlarged' : ''}`}>
          <img src={asset!.src} alt={alt} decoding="async" loading={enlarged || (eager && kind === 'blocks') ? 'eager' : 'lazy'} onError={() => setFailedAsset(assetId)} />
          <span className="visual-focus" aria-hidden="true" style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%`, width: `${focus.width * 100}%`, height: `${focus.height * 100}%` }} />
        </div>
      ) : <p className="visual-fallback">{alt}</p>}
      <p className="visual-callout"><strong>{action === 'verify' ? 'Перевір зараз' : kind === 'editor' ? 'Зроби зараз' : 'Додай зараз'}</strong><span>{focus.label}</span></p>
    </>;
  }

  return <figure className={`visual-figure visual-figure--${kind}`} aria-describedby={explanation ? captionId : undefined}>
    {content()}
    {explanation && <figcaption id={captionId}>{explanation}</figcaption>}
    {available && <div className="visual-toolbar"><button className="visual-button" type="button" onClick={() => setIsOpen(true)}>Відкрити крупніше</button></div>}
    {isOpen && <VisualLightbox onClose={() => setIsOpen(false)}>{content(true)}{explanation && <p>{explanation}</p>}</VisualLightbox>}
  </figure>;
}
