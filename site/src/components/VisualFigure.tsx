import { useId, useState } from 'react';
import { lessonVisualAssets } from '../lesson-visuals/generated-assets';
import type { LessonVisualAssetRegistry, NormalizedRect } from '../lesson-visuals/types';
import { VisualLightbox } from './VisualLightbox';

interface VisualFigureProps {
  assetId: string;
  kind: 'blocks' | 'editor';
  alt: string;
  focus: NormalizedRect;
  additionalFocus?: NormalizedRect[];
  explanation?: string;
  eager?: boolean;
  action?: 'verify';
  sourcePanel?: number;
}

export function VisualFigure({ assetId, kind, alt, focus, additionalFocus = [], explanation, eager = false, action, sourcePanel = 0 }: VisualFigureProps) {
  const [failedAsset, setFailedAsset] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const captionId = useId();
  const registry: LessonVisualAssetRegistry = lessonVisualAssets;
  const asset = Object.hasOwn(registry, assetId) ? registry[assetId] : undefined;
  const available = asset?.kind === kind && failedAsset !== assetId
    && Number.isInteger(sourcePanel) && sourcePanel >= 0 && sourcePanel < (asset.panelCount ?? 1);
  const regions = [focus, ...additionalFocus];

  function content(enlarged = false) {
    return available ? (
      <div className={`visual-image visual-image--${kind}${kind === 'editor' ? ' visual-editor-panel' : ''}${enlarged ? ' visual-image--enlarged' : ''}`}>
        <img src={asset!.src} alt={alt} style={kind === 'editor' ? { top: `${-100 * sourcePanel}%` } : undefined} decoding="async" loading={enlarged || (eager && kind === 'blocks') ? 'eager' : 'lazy'} onError={() => setFailedAsset(assetId)} />
        {regions.map((region, index) => <span key={index} className="visual-focus" aria-hidden="true" style={{ left: `${region.x * 100}%`, top: `${region.y * 100}%`, width: `${region.width * 100}%`, height: `${region.height * 100}%` }} />)}
      </div>
    ) : <p className="visual-fallback">{alt}</p>;
  }

  function callouts() {
    return regions.map((region, index) => <p key={index} className="visual-callout"><strong>{action === 'verify' ? 'Перевір зараз' : kind === 'editor' ? 'Зроби зараз' : 'Додай зараз'}</strong><span>{region.label}</span></p>);
  }

  return <figure className={`visual-figure visual-figure--${kind}`} aria-describedby={explanation ? captionId : undefined}>
    {content()}
    {callouts()}
    {explanation && <figcaption id={captionId}>{explanation}</figcaption>}
    {available && <div className="visual-toolbar"><button className="visual-button" type="button" onClick={() => setIsOpen(true)}>Відкрити крупніше</button></div>}
    {isOpen && <VisualLightbox onClose={() => setIsOpen(false)} caption={<>{callouts()}{explanation && <p>{explanation}</p>}</>}>{content(true)}</VisualLightbox>}
  </figure>;
}
