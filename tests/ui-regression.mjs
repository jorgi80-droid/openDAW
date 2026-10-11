import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'artifacts/ui-regression';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const assert = (ok, message) => { console.log((ok ? 'PASS ' : 'FAIL ') + message); if (!ok) failures.push(message); };
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 854, height: 480 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: false });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto('http://127.0.0.1:4173/app-shell/index.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#timelineScreen');
    const dims = await page.evaluate(() => {
      const box = s => { const r=document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,top:r.top,right:r.right}; };
      return {workspace:box('#workspace'),dock:box('.dock'),timeline:box('#timelineScreen .timeline'),rowCount:document.querySelectorAll('#tracks .trackrow').length,visibleScreenCount:[...document.querySelectorAll('.screen')].filter(el=>getComputedStyle(el).display!=='none').length};
    });
    assert(dims.visibleScreenCount === 1, `one active workspace at ${viewport.width}x${viewport.height}`);
    assert(dims.workspace.bottom <= dims.dock.top + 1, `workspace and dock do not overlap at ${viewport.width}x${viewport.height}`);
    assert(dims.timeline.height > 160 && dims.timeline.width > 300, `timeline has usable dimensions at ${viewport.width}x${viewport.height}`);
    assert(dims.rowCount >= 6, `all six starter tracks rendered at ${viewport.width}x${viewport.height}`);
    const routes = [['timeline','timelineScreen'],['mixer','mixerScreen'],['piano','pianoScreen'],['devices','devicesScreen'],['browser','browserScreen']];
    for (const [route,id] of routes) {
      await page.locator(`.dock button[data-screen="${route}"]`).click();
      assert(await page.locator(`#${id}`).isVisible(), `${route} route is visible at ${viewport.width}x${viewport.height}`);
      assert(await page.locator('.screen:visible').count() === 1, `only ${route} is visible at ${viewport.width}x${viewport.height}`);
    }
    await page.locator('#browserTabs button[data-cat="Samples"]').click();
    assert(await page.locator('#samples .sample').count() === 10, `Browser Samples has 10 items at ${viewport.width}x${viewport.height}`);
    for (const [cat,count] of [['Instruments',4],['Effects',6],['Presets',4]]) {
      await page.locator(`#browserTabs button[data-cat="${cat}"]`).click();
      assert(await page.locator('#samples .sample').count() === count, `Browser ${cat} populates ${count} items at ${viewport.width}x${viewport.height}`);
    }
    await page.locator('.dock button[data-screen="devices"]').click();
    await page.locator('#devTabs button[data-cat="Effect"]').click();
    assert(await page.locator('#devices .panel').count() === 5, `Devices Effect tab renders 5 cards at ${viewport.width}x${viewport.height}`);
    await page.locator('.dock button[data-screen="mixer"]').click();
    assert(await page.locator('#mixer input[type="range"][data-mix="gain"]').count() === 6, `Mixer shows one gain control per track at ${viewport.width}x${viewport.height}`);
    const mixerSmall = await page.locator('#mixer .channel').evaluateAll(channels => channels.some(channel => { const r=channel.getBoundingClientRect(); return r.width < 100 || r.height < 80; }));
    assert(!mixerSmall, `mixer channel cards have usable area at ${viewport.width}x${viewport.height}`);
    await page.locator('.dock button[data-screen="piano"]').click();
    const initialNotes = await page.locator('#pianogrid .note').count();
    const grid = await page.locator('#pianogrid').boundingBox();
    await page.mouse.click(grid.x + grid.width*0.72, grid.y + grid.height*0.36);
    assert(await page.locator('#pianogrid .note').count() === initialNotes+1, `tap empty Piano Roll cell adds a note at ${viewport.width}x${viewport.height}`);
    const notesInside = await page.locator('#pianogrid .note').evaluateAll(notes => { const g=document.querySelector('#pianogrid').getBoundingClientRect(); return notes.every(note => { const r=note.getBoundingClientRect(); return r.left>=g.left-1 && r.right<=g.right+1 && r.top>=g.top-1 && r.bottom<=g.bottom+1; }); });
    assert(notesInside, `all Piano Roll notes remain inside note grid at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#velocity span').count() === 16, `velocity bars remain in separate lane at ${viewport.width}x${viewport.height}`);
    assert(pageErrors.length === 0, `no JavaScript exceptions at ${viewport.width}x${viewport.height}${pageErrors.length ? ': '+pageErrors.join('; ') : ''}`);
    for (const [route,id] of routes) {
      await page.locator('.dock button[data-screen="'+route+'"]').click();
      await page.locator('#toast').evaluate(el => { el.hidden = true; });
      await page.screenshot({ path:path.join(outDir,`${viewport.width}x${viewport.height}-${route}.png`), fullPage:true });
    }
    await context.close();
  }
} finally { await browser.close(); }
if (failures.length) { console.error(`UI regression failures: ${failures.length}`); process.exit(1); }
console.log('All NovaDAW browser regression tests passed.');
