import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { campaign06 } from '../../src/curriculum/campaign-06.ts';

test('C06-003/C06-006: current Arcade maps the win block and runs exactly one four-enemy Python wave', { timeout: 60_000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto('https://arcade.makecode.com/--docs?render=1&lang=en');
    await page.waitForFunction(() => window.pxt?.runner?.decompileSnippetAsync);
    const mapping = await page.evaluate(async () => {
      const c = await pxt.runner.decompileSnippetAsync('game.gameOver(true)', { forceCompilation: true });
      return { python: c.compilePython.outfiles['main.py'], xml: c.compileBlocks.outfiles['main.blocks'], diagnostics: c.compileJS.diagnostics };
    });
    assert.match(mapping.python, /game.game_over\(True\)/);
    assert.match(mapping.xml, /type="gameOver2"/); assert.match(mapping.xml, /<field name="win">true<\/field>/);
    assert.deepEqual(mapping.diagnostics, []);
    assert.ok(campaign06.lessons[0].challenge.hint.includes(mapping.python.trim()));
    const lesson = campaign06.lessons[1];
    const loop = 'for speed in speeds:\n    spawn_enemy(speed)\n    pause(500)';
    const signature = lesson.challenge.hint.match(/def start_wave\(speeds: List\[number\]\):/)[0];
    const code = lesson.steps[5].visual.code.replace(loop, `${signature}\n${loop.split('\n').map(line => '    ' + line).join('\n')}\n\nstart_wave([30, 45, 60, 75])`);
    const result = await page.evaluate(async code => {
      const seed = await pxt.runner.decompileSnippetAsync('', { forceCompilation: true });
      const opts = await seed.package.getCompileOptionsAsync();
      opts.target.isNative = false; opts.target.preferredEditor = 'pyprj';
      opts.fileSystem['main.py'] = code; opts.fileSystem['main.ts'] = ''; opts.sourceFiles.push('main.py'); opts.apisInfo = seed.apiInfo;
      const py = pxt.py.py2ts(opts);
      if (!py.success) return { diagnostics: py.diagnostics };
      const c = await pxt.runner.decompileSnippetAsync(py.outfiles['main.ts'], { forceCompilation: true });
      const div = document.createElement('div'); document.body.append(div);
      await pxt.runner.simulateAsync(div, { builtJsInfo: { ...pxtc.buildSimJsInfo(c.compileJS), parts: [], usedBuiltinParts: [], allParts: [] } });
      return { success: c.compileJS.success, diagnostics: c.compileJS.diagnostics };
    }, code);
    assert.equal(result.success, true); assert.deepEqual(result.diagnostics, []);
    await page.waitForFunction(() => [...document.querySelectorAll('iframe')].some(f => f.src.includes('---simulator')));
    for (let i = 0; i < 100 && !page.frames().some(f => f.url().includes('---simulator')); i++) await page.waitForTimeout(50);
    const sim = page.frames().find(f => f.url().includes('---simulator'));
    await sim.waitForFunction(() => window.pxsim?.runtime?.globals);
    await page.waitForTimeout(1900);
    const enemies = await sim.evaluate(() => Object.entries(pxsim.runtime.globals).find(([key]) => key.startsWith('_scene___'))[1].fields.allSprites.data.length);
    assert.equal(enemies, 4);
  } finally { await browser.close(); }
});
