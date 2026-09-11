import { describe, expect, it } from 'vitest';
import { tokenizePython } from './pythonTokens';

describe('tokenizePython', () => {
  it('classifies Python syntax while preserving every source character', () => {
    const source = 'if score >= 10:\n    game.splash("Привіт") # comment\n';
    const tokens = tokenizePython(source);
    expect(tokens.map(({ value }) => value).join('')).toBe(source);
    for (const token of [
      { type: 'keyword', value: 'if' },
      { type: 'identifier', value: 'score' },
      { type: 'number', value: '10' },
      { type: 'string', value: '"Привіт"' },
      { type: 'comment', value: '# comment' },
      { type: 'punctuation', value: ':' },
      { type: 'whitespace', value: '\n    ' },
    ]) expect(tokens).toContainEqual(token);
  });

  it.each(['', '"<script>alert(1)</script>"', "x = 'it\\'s fine'\r\n", 'x = 0xff + 1.25e-3', '"""first\nsecond"""', 'ім’я = "так"'])('preserves source %j', (source) => {
    expect(tokenizePython(source).map(({ value }) => value).join('')).toBe(source);
  });
});
