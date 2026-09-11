import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  validateCatalog,
  validateRenderResponse,
  validateSvg,
  normalizeRendererSvg,
  stagedReplace,
} from './render-blocks-lib.mjs';

const id = 'lesson-01-step-04';
const entry = { id, code: 'scene.setBackgroundColor(7)', options: { snippetMode: true } };
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><text>set background color</text></svg>';
const frameWindow = {};
const message = { source: 'makecode', type: 'renderblocks', id, svg, width: 120, height: 40 };
const event = { origin: 'https://arcade.makecode.com', source: frameWindow, data: message };

test('catalog rejects duplicate IDs before any output can be overwritten', () => {
  assert.throws(() => validateCatalog([entry, { ...entry }]), /lesson-01-step-04.*duplicate/i);
});

test('catalog rejects IDs that could escape the output directory', () => {
  assert.throws(() => validateCatalog([{ ...entry, id: '../escape' }]), /\.\.\/escape/);
});

test('accepts a complete trusted response', () => {
  assert.equal(validateRenderResponse(event, frameWindow, id), svg);
});

for (const [label, change] of [
  ['non-MakeCode origin', { origin: 'https://example.com' }],
  ['wrong frame window', { source: {} }],
  ['wrong message source', { data: { ...message, source: 'someone-else' } }],
  ['wrong response type', { data: { ...message, type: 'renderready' } }],
  ['wrong response ID', { data: { ...message, id: 'another-id' } }],
  ['renderer error', { data: { ...message, error: 'compilation failed' } }],
  ['blank SVG', { data: { ...message, svg: '  ' } }],
  ['malformed SVG', { data: { ...message, svg: '<svg><g></svg>' } }],
  ['zero width', { data: { ...message, width: 0 } }],
  ['zero height', { data: { ...message, height: 0 } }],
  ['infinite dimension', { data: { ...message, height: Infinity } }],
  ['string dimension', { data: { ...message, width: '120' } }],
]) {
  test(`rejects ${label} and identifies the catalog entry`, () => {
    assert.throws(() => validateRenderResponse({ ...event, ...change }, frameWindow, id), /lesson-01-step-04/);
  });
}

test('missing response fails with the catalog ID', () => {
  assert.throws(() => validateRenderResponse(undefined, frameWindow, id), /lesson-01-step-04.*missing/i);
});

for (const [label, unsafeSvg] of [
  ['script', svg.replace('</svg>', '<script>alert(1)</script></svg>')],
  ['JavaScript URL', svg.replace('</svg>', '<a href="javascript:alert(1)"/></svg>')],
  ['remote href', svg.replace('</svg>', '<image href="https://example.com/image.png"/></svg>')],
  ['protocol-relative href', svg.replace('</svg>', '<image href="//example.com/image.png"/></svg>')],
  ['encoded remote href', svg.replace('</svg>', '<image href="&#104;ttps://example.com/image.png"/></svg>')],
  ['event handler', svg.replace('<text>', '<text onclick="alert(1)">')],
  ['zero viewBox', svg.replace('0 0 120 40', '0 0 0 40')],
  ['zero SVG dimensions', svg.replace('width="120"', 'width="0"')],
  ['missing SVG dimensions', '<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>'],
]) {
  test(`SVG validation rejects ${label}`, () => {
    assert.throws(() => validateSvg(unsafeSvg, id), /lesson-01-step-04/);
  });
}

test('SVG accepts a positive viewBox without explicit dimensions', () => {
  assert.equal(validateSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40"/>', id).width, 120);
});

for (const [label, resource] of [
  ['XML entity', '&#104;ttps://example.com/paint.svg#paint'],
  ['CSS escaped https', String.raw`\68 ttps://example.com/paint.svg#paint`],
  ['CSS escaped http', String.raw`\000068ttp://example.com/paint.svg#paint`],
  ['CSS escaped slash', String.raw`\2f\2f example.com/paint.svg#paint`],
  ['relative URL', 'paint.svg#paint'],
  ['unsupported data type', 'data:text/html;base64,AAAA'],
]) {
  for (const location of ['attribute', 'element']) {
    test(`rejects ${label} CSS URL in a style ${location}`, () => {
      const markup = location === 'attribute'
        ? svg.replace('<text>', `<text style="fill: url('${resource}')">`)
        : svg.replace('</svg>', `<style>text { fill: url('${resource}'); }</style></svg>`);
      assert.throws(() => validateSvg(markup, id), /lesson-01-step-04.*(?:remote|unsupported)/);
    });
  }
}

test('rejects escaped CSS URL functions and encoded presentation attribute URLs', () => {
  assert.throws(() => validateSvg(svg.replace('<text>', String.raw`<text style="fill: u\72l('\68 ttps://example.com/a')">`), id), /lesson-01-step-04.*remote/);
  assert.throws(() => validateSvg(svg.replace('<text>', '<text fill="url(&#104;ttps://example.com/a)">'), id), /lesson-01-step-04.*remote/);
  assert.throws(() => validateSvg(svg.replace('</svg>', String.raw`<style>@\69mport 'https://example.com/a.css';</style></svg>`), id), /lesson-01-step-04.*remote/);
});

for (const expression of [
  'image-set("https://example.com/x.png" 1x)',
  '-webkit-image-set("../x.png" 1x)',
  String.raw`image-set("\68 ttps://example.com/x.png" 1x)`,
  String.raw`image-\73 et("&#104;ttps://example.com/x.png" 1x)`,
  'image("https://example.com/x.png", red)',
  'src("https://example.com/x.png")',
  'cross-fade(image-set("https://example.com/x.png" 1x), url(#paint), 50%)',
  'image-set(url(#paint) 1x, "https://example.com/x.png" 2x)',
  'image-set(var(--remote) 1x)',
  'image-set(attr(data-src) 1x)',
  'image-set(--custom-image() 1x)',
]) {
  for (const location of ['attribute', 'element']) {
    test(`rejects external or unresolved CSS image expression ${expression} in ${location}`, () => {
      const markup = location === 'attribute'
        ? svg.replace('<text>', `<text style="mask-image: ${expression.replaceAll('"', '&quot;')}">`)
        : svg.replace('</svg>', `<style>text { mask-image: ${expression}; }</style></svg>`);
      assert.throws(() => validateSvg(markup, id), /lesson-01-step-04.*(?:remote|unsupported)/);
    });
  }
}

for (const expression of [
  'image-set("#paint" 1x, url(#paint) 2x)',
  '-webkit-image-set("data:image/png;base64,AAAA" 1x)',
  'image-set("data:image/webp;base64,AAAA" type("image/webp") 1x)',
  'image("#paint", red)',
  'src("#paint")',
  'cross-fade(image-set("#paint" 1x), linear-gradient(red, blue), 50%)',
  'image-set(linear-gradient(rgb(0, 0, 0), rgb(255, 255, 255)) 1x)',
]) {
  test(`preserves recognized self-contained CSS image expression ${expression}`, () => {
    const markup = svg.replace('<text>', `<text style="mask-image: ${expression.replaceAll('"', '&quot;')}">`)
      .replace('</svg>', `<style>text { mask-image: ${expression}; }</style></svg>`);
    assert.deepEqual(validateSvg(markup, id), { width: 120, height: 40 });
  });
}

for (const resource of [
  '#paint',
  String.raw`\23 paint`,
  'data:image/png;base64,AAAA',
  'data:image/webp;base64,AAAA',
  'data:font/woff;base64,AAAA',
  'data:font/woff2;base64,AAAA',
  'data:application/x-font-ttf;base64,AAAA',
  'data:application/font-woff;charset=utf-8;base64,AAAA',
]) {
  test(`preserves supported CSS resource ${resource}`, () => {
    const markup = svg.replace('<text>', `<text style="fill: url('${resource}')">`)
      .replace('</svg>', `<style>@font-face { font-family: Icon; src: url('${resource}'); }</style></svg>`);
    assert.deepEqual(validateSvg(markup, id), { width: 120, height: 40 });
  });
}

test('permits self-contained embedded SVG images after recursively validating decoded content', () => {
  const embedded = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path fill="green" d="M0 0h16v16H0z"/></svg>';
  for (const resource of [
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(embedded)}`,
    `data:image/svg+xml;base64,${Buffer.from(embedded).toString('base64')}`,
  ]) {
    assert.deepEqual(validateSvg(svg.replace('<text>', `<text style="fill: url('${resource}')">`), id), { width: 120, height: 40 });
  }
});

test('rejects remote resources hidden inside embedded SVG images', () => {
  const embedded = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><image href="https://example.com/image.png"/></svg>';
  const resource = `data:image/svg+xml;base64,${Buffer.from(embedded).toString('base64')}`;
  assert.throws(() => validateSvg(svg.replace('<text>', `<text style="fill: url('${resource}')">`), id), /lesson-01-step-04.*(?:remote|unsupported)/);
});

test('permits safe embedded editor SVG icons without explicit intrinsic dimensions', () => {
  const embedded = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="green" d="M0 0h16v16H0z"/></svg>';
  const resource = `data:image/svg+xml;base64,${Buffer.from(embedded).toString('base64')}`;
  assert.deepEqual(validateSvg(svg.replace('<text>', `<text style="fill: url('${resource}')">`), id), { width: 120, height: 40 });
});

test('permits official dropdown icons in image href after recursively validating the embedded SVG', () => {
  const icon = '<svg xmlns="http://www.w3.org/2000/svg" width="12.71" height="8.79"><title>dropdown-arrow</title><path d="M0 0L6 8L12 0z"/></svg>';
  for (const resource of [
    `data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}`,
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon)}`,
  ]) {
    const markup = svg.replace('</svg>', `<image href="${resource}"/></svg>`);
    assert.deepEqual(validateSvg(markup, id), { width: 120, height: 40 });
  }
});

test('embedded SVG href rejects nested remote resources, active content, malformed data and excessive nesting', () => {
  const wrap = (content) => svg.replace('</svg>', `<image href="data:image/svg+xml;base64,${Buffer.from(content).toString('base64')}"/></svg>`);
  const unsafe = [
    svg.replace('</svg>', '<image href="https://example.com/remote.png"/></svg>'),
    svg.replace('</svg>', '<image href="relative.png"/></svg>'),
    svg.replace('</svg>', '<script>alert(1)</script></svg>'),
    '<svg><g></svg>',
  ];
  for (const content of unsafe) assert.throws(() => validateSvg(wrap(content), id), /lesson-01-step-04/);
  assert.throws(() => validateSvg(svg.replace('</svg>', '<image href="data:image/svg+xml;base64,%%%"/></svg>'), id), /lesson-01-step-04/);
  let nested = svg;
  for (let depth = 0; depth < 10; depth++) nested = wrap(nested);
  assert.throws(() => validateSvg(nested, id), /lesson-01-step-04.*nesting depth/);
});

test('permits XML declarations and editor comments in embedded controller SVG icons', () => {
  const icon = '<?xml version="1.0" encoding="UTF-8" standalone="no"?><!-- Exported icon -->' + svg;
  const resource = `data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}`;
  assert.deepEqual(validateSvg(svg.replace('</svg>', `<image href="${resource}"/></svg>`), id), { width: 120, height: 40 });
});

test('rejects XML stylesheet instructions hidden before an embedded SVG root', () => {
  const icon = '<?xml version="1.0"?><?xml-stylesheet type="text/css" href="https://example.com/remote.css"?>' + svg;
  const resource = `data:image/svg+xml;base64,${Buffer.from(icon).toString('base64')}`;
  assert.throws(() => validateSvg(svg.replace('</svg>', `<image href="${resource}"/></svg>`), id), /lesson-01-step-04.*processing instruction/);
});

for (const [tag, attributes] of [
  ['set', 'attributeName="href" to="https://example.com/remote.png" begin="0s"'],
  ['animate', 'attributeName="href" values="#safe;https://example.com/remote.png" dur="1s"'],
  ['animateColor', 'attributeName="fill" from="red" to="blue" dur="1s"'],
  ['animateTransform', 'attributeName="transform" type="translate" from="0 0" to="10 10" dur="1s"'],
  ['animateMotion', 'path="M0 0L10 10" dur="1s"'],
  ['mpath', 'href="#motion-path"'],
  ['discard', 'begin="0s"'],
]) {
  for (const location of ['top-level', 'embedded href', 'embedded CSS']) {
    test(`static SVG rejects SMIL ${tag} in ${location}`, () => {
      const active = svg.replace('</svg>', `<image><${tag} ${attributes}/></image></svg>`);
      const resource = `data:image/svg+xml;base64,${Buffer.from(active).toString('base64')}`;
      const markup = location === 'top-level' ? active : location === 'embedded href'
        ? svg.replace('</svg>', `<image href="${resource}"/></svg>`)
        : svg.replace('<text>', `<text style="fill: url('${resource}')">`);
      assert.throws(() => validateSvg(markup, id), /lesson-01-step-04.*SMIL/);
    });
  }
}

test('static SVG rejects namespace-prefixed SMIL elements by local name', () => {
  const markup = svg.replace('</svg>', '<s:set xmlns:s="http://www.w3.org/2000/svg" attributeName="href" to="https://example.com/remote.png"/></svg>');
  assert.throws(() => validateSvg(markup, id), /lesson-01-step-04.*SMIL/);
});

test('removes official editor cursor and toolbox sprite CSS without changing block geometry or visible styles', () => {
  const style = '<style>.blocklyTreeIcon { background: url(https://cdn.makecode.com/commit/abc/blockly/media/sprites.svg) no-repeat -48px -16px; color: red; } .blocklyDraggable { cursor: url("https://cdn.makecode.com/commit/abc/blockly/media/handclosed.cur"), auto; }</style>';
  const normalized = normalizeRendererSvg(svg.replace('<text>', `${style}<text>`), id);
  assert.doesNotMatch(normalized, /https:\/\/cdn.makecode.com/);
  assert.match(normalized, /color: red;/);
  assert.match(normalized, /<text>set background color<\/text>/);
  assert.deepEqual(validateSvg(normalized, id), { width: 120, height: 40 });
});

test('normalization still rejects other remote styles and remote hrefs', () => {
  assert.throws(() => normalizeRendererSvg(svg.replace('</svg>', '<style>.x { background: url(https://example.com/picture.png); }</style></svg>'), id), /lesson-01-step-04.*remote/);
  assert.throws(() => normalizeRendererSvg(svg.replace('</svg>', '<image href="https://example.com/picture.png"/></svg>'), id), /lesson-01-step-04.*href/);
});

test('normalizes known unused cursor placeholders and legacy editor font fallbacks while retaining embedded WOFF', () => {
  const style = '<style><![CDATA[.editor { cursor:url(<<<PATH>>>/handdelete.cur) auto} @font-face { font-family: Icons; src:url(fonts/icons.eot); src:url(data:font/woff;base64,AAAA); }]]></style>';
  const normalized = normalizeRendererSvg(svg.replace('</svg>', `${style}</svg>`), id);
  assert.doesNotMatch(normalized, /<<<PATH>>>|fonts\/icons\.eot/);
  assert.match(normalized, /data:font\/woff;base64,AAAA/);
});

test('permits octet-stream embedded fonts only when bytes have a supported font signature', () => {
  const font = 'data:application/octet-stream;base64,AAEAAAA=';
  assert.deepEqual(validateSvg(svg.replace('</svg>', `<style>@font-face { src:url(${font}); }</style></svg>`), id), { width: 120, height: 40 });
  assert.throws(() => validateSvg(svg.replace('</svg>', '<style>@font-face { src:url(data:application/octet-stream;base64,AAAA); }</style></svg>'), id), /lesson-01-step-04.*unsupported/);
});

async function directories(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'kodkvest-blocks-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const liveDir = path.join(root, 'live');
  const stagingDir = path.join(root, 'staging');
  await mkdir(liveDir);
  await writeFile(path.join(liveDir, `${id}.svg`), 'existing bytes\n');
  return { root, liveDir, stagingDir };
}

test('failed staged batch leaves existing live SVG byte-for-byte unchanged and removes partial results', async (t) => {
  const dirs = await directories(t);
  await assert.rejects(stagedReplace({
    ...dirs,
    catalog: [entry, { ...entry, id: 'lesson-01-step-05' }],
    render: async (item) => item.id === id ? svg : undefined,
  }), /lesson-01-step-05/);
  assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), 'existing bytes\n');
  assert.deepEqual(await readdir(dirs.root), ['live']);
});

test('successful batch replaces the complete directory only after every render succeeds', async (t) => {
  const dirs = await directories(t);
  await writeFile(path.join(dirs.liveDir, 'obsolete.svg'), 'old asset');
  await stagedReplace({
    ...dirs,
    catalog: [entry],
    render: async () => {
      assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), 'existing bytes\n');
      return svg;
    },
  });
  assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), svg);
  assert.deepEqual(await readdir(dirs.liveDir), [`${id}.svg`]);
  assert.deepEqual(await readdir(dirs.root), ['live']);
});

test('registry failure after replacement rolls back the live directory', async (t) => {
  const dirs = await directories(t);
  await assert.rejects(stagedReplace({
    ...dirs,
    catalog: [entry],
    render: async () => svg,
    afterReplace: async () => { throw new Error('registry failed'); },
  }), /lesson-01-step-04.*registry failed/);
  assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), 'existing bytes\n');
  assert.deepEqual(await readdir(dirs.root), ['live']);
});

test('refuses to delete another render process staging directory', async (t) => {
  const dirs = await directories(t);
  await mkdir(dirs.stagingDir);
  await writeFile(path.join(dirs.stagingDir, 'owned-by-another-run'), 'keep');
  await assert.rejects(stagedReplace({ ...dirs, catalog: [entry], render: async () => svg }), /lesson-01-step-04/);
  assert.equal(await readFile(path.join(dirs.stagingDir, 'owned-by-another-run'), 'utf8'), 'keep');
});

test('keeps the batch locked through registry generation after the stage has moved', async (t) => {
  const dirs = await directories(t);
  await stagedReplace({
    ...dirs,
    catalog: [entry],
    render: async () => svg,
    afterReplace: async () => {
      await assert.rejects(stagedReplace({ ...dirs, catalog: [entry], render: async () => svg }), /lesson-01-step-04.*locked/i);
      assert.equal(await readFile(path.join(dirs.liveDir, `${id}.svg`), 'utf8'), svg);
    },
  });
  assert.deepEqual(await readdir(dirs.root), ['live']);
});
