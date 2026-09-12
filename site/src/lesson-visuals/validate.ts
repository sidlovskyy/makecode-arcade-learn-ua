import type { LessonVisualAssetRegistry } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRequiredString(
  stepId: string,
  field: string,
  value: unknown,
  errors: string[],
): void {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${stepId} ${field} is required`);
  }
}

function validateFocus(
  stepId: string,
  field: string,
  focus: unknown,
  errors: string[],
): void {
  if (!isRecord(focus)) {
    errors.push(`${stepId} ${field} must be an object`);
    return;
  }
  validateRequiredString(stepId, `${field}.label`, focus.label, errors);

  const { x, y, width, height } = focus;
  const fitsNormalizedBounds =
    typeof x === 'number' && typeof y === 'number' &&
    typeof width === 'number' && typeof height === 'number' &&
    [x, y, width, height].every((value) => Number.isFinite(value) && value >= 0 && value <= 1) &&
    x + width <= 1 && y + height <= 1;

  if (!fitsNormalizedBounds) {
    errors.push(`${stepId} ${field} must fit within normalized coordinates 0..1`);
  }
}

function validateAsset(
  stepId: string,
  field: string,
  assetId: unknown,
  expectedKind: 'blocks' | 'editor',
  assets: LessonVisualAssetRegistry,
  errors: string[],
): void {
  validateRequiredString(stepId, field, assetId, errors);
  if (typeof assetId !== 'string' || !assetId.trim()) {
    return;
  }

  const asset = Object.hasOwn(assets, assetId) ? assets[assetId] : undefined;
  if (!asset) {
    errors.push(`${stepId} ${field} "${assetId}" is not registered`);
  } else if (asset.kind !== expectedKind) {
    errors.push(`${stepId} ${field} "${assetId}" must reference a ${expectedKind} asset`);
  }
}

export function validateLessonVisual(
  stepId: string,
  visual: unknown,
  assets: LessonVisualAssetRegistry,
): string[] {
  const errors: string[] = [];
  if (visual === undefined || visual === null) return [`${stepId} visual is required`];
  if (!isRecord(visual)) return [`${stepId} visual must be an object`];

  const image = visual.kind === 'comparison' ? visual.blocks : visual;
  if (visual.kind === 'editor' && visual.sourcePanel !== undefined) {
    const asset = typeof visual.assetId === 'string' && Object.hasOwn(assets, visual.assetId) ? assets[visual.assetId] : undefined;
    if (typeof visual.sourcePanel !== 'number' || !Number.isInteger(visual.sourcePanel)
      || visual.sourcePanel < 0 || visual.sourcePanel >= (asset?.panelCount ?? 1)) {
      errors.push(`${stepId} sourcePanel must select an available editor panel`);
    }
  }
  if (isRecord(image) && image.additionalFocus !== undefined) {
    if (!Array.isArray(image.additionalFocus)) errors.push(`${stepId} additionalFocus must be an array`);
    else image.additionalFocus.forEach((focus, index) => validateFocus(stepId, `additionalFocus[${index}]`, focus, errors));
  }

  switch (visual.kind) {
    case 'blocks':
    case 'editor':
      validateRequiredString(stepId, 'alt', visual.alt, errors);
      validateRequiredString(stepId, 'explanation', visual.explanation, errors);
      validateAsset(stepId, 'assetId', visual.assetId, visual.kind, assets, errors);
      validateFocus(stepId, 'focus', visual.focus, errors);
      break;
    case 'python':
      validateRequiredString(stepId, 'label', visual.label, errors);
      validateRequiredString(stepId, 'code', visual.code, errors);
      validateRequiredString(stepId, 'explanation', visual.explanation, errors);
      break;
    case 'comparison':
      validateRequiredString(stepId, 'explanation', visual.explanation, errors);
      if (isRecord(visual.blocks)) {
        validateRequiredString(stepId, 'blocks.alt', visual.blocks.alt, errors);
        validateAsset(stepId, 'blocks.assetId', visual.blocks.assetId, 'blocks', assets, errors);
        validateFocus(stepId, 'blocks.focus', visual.blocks.focus, errors);
      } else {
        errors.push(`${stepId} blocks must be an object`);
      }
      if (isRecord(visual.python)) {
        validateRequiredString(stepId, 'python.label', visual.python.label, errors);
        validateRequiredString(stepId, 'python.code', visual.python.code, errors);
      } else {
        errors.push(`${stepId} python must be an object`);
      }
      break;
    case 'guide':
      validateRequiredString(stepId, 'guide title', visual.title, errors);
      if (!Array.isArray(visual.items) || visual.items.length === 0) {
        errors.push(`${stepId} guide items must not be empty`);
      } else {
        visual.items.forEach((item, index) => {
          validateRequiredString(stepId, `guide item ${index + 1}`, item, errors);
        });
      }
      break;
    default:
      errors.push(`${stepId} visual kind is invalid`);
      break;
  }

  return errors;
}
