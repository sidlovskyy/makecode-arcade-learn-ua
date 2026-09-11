export type PythonTokenType = 'keyword' | 'string' | 'number' | 'comment' | 'identifier' | 'punctuation' | 'whitespace';
export interface PythonToken { type: PythonTokenType; value: string }

const keywords = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
// Sticky matches consume the source from left to right; the final character
// fallback keeps incomplete examples and unfamiliar syntax lossless.
const syntax = /\s+|#[^\r\n]*|(?:[rRuUbBfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\[\s\S]|[^"\\\r\n])*(?:"|$)|'(?:\\[\s\S]|[^'\\\r\n])*(?:'|$))|(?:0[xX][\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?[\d_]+)?j?)|[\p{L}_][\p{L}\p{N}_]*|[\s\S]/uy;

export function tokenizePython(source: string): PythonToken[] {
  const tokens: PythonToken[] = [];
  syntax.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = syntax.exec(source))) {
    const value = match[0];
    const type: PythonTokenType = /^\s/.test(value) ? 'whitespace'
      : value.startsWith('#') ? 'comment'
      : /^(?:[rRuUbBfF]{1,2})?["']/.test(value) ? 'string'
      : /^(?:\d|\.\d)/.test(value) ? 'number'
      : keywords.has(value) ? 'keyword'
      : /^[\p{L}_]/u.test(value) ? 'identifier'
      : 'punctuation';
    tokens.push({ type, value });
  }
  return tokens;
}
