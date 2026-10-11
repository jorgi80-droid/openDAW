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
    assert(await page.locator('#timelineTools').isVisible(), `timeline edit rail is visible at ${viewport.width}x${viewport.height}`);
    await page.locator('#timelineTools [data-timeline-tool="zoom-in"]').click();
    assert(await page.locator('#zoomLabel').innerText() === '125%', `timeline zoom-in changes zoom state at ${viewport.width}x${viewport.height}`);
    const zoomedWidth = await page.locator('#tracks .clip-canvas').first().evaluate(el=>el.getBoundingClientRect().width);
    const viewportWidth = await page.locator('#tracks .cliparea').first().evaluate(el=>el.clientWidth);
    assert(zoomedWidth > viewportWidth, `zoom expands clip canvas without resizing track label column at ${viewport.width}x${viewport.height}`);
    await page.locator('#timelineTools [data-timeline-tool="zoom-out"]').click();
    assert(await page.locator('#zoomLabel').innerText() === '100%', `timeline zoom-out restores baseline at ${viewport.width}x${viewport.height}`);
    const labelXBefore = await page.locator('#tracks .tracklabel').first().evaluate(el=>el.getBoundingClientRect().x);
    const clipScroll = page.locator('#tracks .cliparea').first();
    await clipScroll.evaluate(el=>{el.scrollLeft=100;el.dispatchEvent(new Event('scroll',{bubbles:true}));});
    const labelXAfter = await page.locator('#tracks .tracklabel').first().evaluate(el=>el.getBoundingClientRect().x);
    assert(Math.abs(labelXAfter-labelXBefore)<1, `track label stays fixed while clip canvas scrolls at ${viewport.width}x${viewport.height}`);
    const routes = [['timeline','timelineScreen'],['mixer','mixerScreen'],['piano','pianoScreen'],['devices','devicesScreen'],['browser','browserScreen']];
    for (const [route,id] of routes) {
      await page.locator(`.dock button[data-screen="${route}"]`).click();
      assert(await page.locator(`#${id}`).isVisible(), `${route} route is visible at ${viewport.width}x${viewport.height}`);
      assert(await page.locator('.screen:visible').count() === 1, `only ${route} is visible at ${viewport.width}x${viewport.height}`);
    }
    await page.locator('#browserTabs button[data-cat="Samples"]').click();
    assert(await page.locator('#samples .sample').count() === 10, `Browser Samples has 10 items at ${viewport.width}x${viewport.height}`);
    const sampleRowsClean = await page.locator('#samples .sample').evaluateAll(rows => rows.every(row => {
      const rowRect=row.getBoundingClientRect(), name=row.querySelector('.sample-name')?.getBoundingClientRect(), wave=row.querySelector('.wave')?.getBoundingClientRect(), status=row.querySelector('.sample-status')?.getBoundingClientRect();
      return name && wave && status && name.top >= rowRect.top && status.bottom <= rowRect.bottom && name.bottom <= wave.top + 2 && wave.bottom <= status.top + 2;
    }));
    assert(sampleRowsClean, `Browser sample title, waveform and status do not overlap at ${viewport.width}x${viewport.height}`);
    for (const [cat,count] of [['Instruments',4],['Effects',6],['Presets',4]]) {
      await page.locator(`#browserTabs button[data-cat="${cat}"]`).click();
      assert(await page.locator('#samples .sample').count() === count, `Browser ${cat} populates ${count} items at ${viewport.width}x${viewport.height}`);
    }
    await page.locator('.dock button[data-screen="devices"]').click();
    await page.locator('#devTabs button[data-cat="Effect"]').click();
    assert(await page.locator('#devices .device-option').count() === 6, `Devices Effect tab lists 6 effects at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#devices .device-editor').isVisible(), `Devices has one focused editor at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices .device-page-tabs button[data-device-page=\"TIME\"]').click();
    assert(await page.locator('#devices .device-page-tabs button.active').innerText() === 'TIME', `device effect pages switch at ${viewport.width}x${viewport.height}`);
    // Rack identity is per track: choosing a different track must not reuse the same instrument selection.
    await page.locator('#devTabs button[data-cat="Instrument"]').click();
    await page.locator('#devices [data-device-select="Nano Sampler"]').click();
    await page.locator('#deviceTrackMenu').click();
    await page.locator('#deviceTrackPicker [data-rack-track="1"]').click();
    assert(await page.locator('#deviceTrackLabel').innerText().includes('Bass'), `Devices displays the selected track name at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#devices .device-editor h3').innerText() === 'Vaporisateur Synth', `each track retains its own instrument rack at ${viewport.width}x${viewport.height}`);
    await page.locator('.dock button[data-screen="timeline"]').click();
    await page.locator('.dock button[data-screen="devices"]').click();
    assert(await page.locator('#deviceTrackLabel').innerText().includes('Bass') && await page.locator('#devices .device-editor h3').innerText() === 'Vaporisateur Synth', `Devices refreshes the active track rack after route switching at ${viewport.width}x${viewport.height}`);
    await page.locator('#deviceTrackMenu').click();
    await page.locator('#deviceTrackPicker [data-rack-track="0"]').click();
    assert(await page.locator('#devices .device-editor h3').innerText() === 'Nano Sampler', `switching back restores the previous track instrument at ${viewport.width}x${viewport.height}`);
    await page.locator('.dock button[data-screen="mixer"]').click();
    assert(await page.locator('#mixer input[type="range"][data-mix="gain"]').count() === 6, `Mixer shows one gain control per track at ${viewport.width}x${viewport.height}`);
    const mixerSmall = await page.locator('#mixer .channel').evaluateAll(channels => channels.some(channel => { const r=channel.getBoundingClientRect(); return r.width < 100 || r.height < 80; }));
    assert(!mixerSmall, `mixer channel cards have usable area at ${viewport.width}x${viewport.height}`);
    const verticalFaders = await page.locator('#mixer input[data-mix="gain"]').evaluateAll(inputs => inputs.every(el => getComputedStyle(el).writingMode.includes('vertical') && el.getBoundingClientRect().height > el.getBoundingClientRect().width * 2));
    assert(verticalFaders, `Mixer gain faders are vertical and separate from pan at ${viewport.width}x${viewport.height}`);
    // Track context actions: rename is usable and a second tab/menu interaction does not change screen.
    await page.locator('.dock button[data-screen="timeline"]').click();
    await page.locator('#tracks [data-action="menu"]').first().click();
    assert(await page.locator('#trackMenuOverlay').isVisible(), `track context sheet opens at ${viewport.width}x${viewport.height}`);
    await page.locator('[data-track-menu-action="rename"]').click();
    await page.locator('#renameTrackInput').fill('Drums QA');
    await page.locator('#saveTrackName').click();
    assert((await page.locator('#tracks .trackname').first().innerText()).includes('Drums QA'), `track rename commits to the model at ${viewport.width}x${viewport.height}`);
    await page.locator('#tracks [data-action="menu"]').first().click();
    await page.locator('[data-track-menu-action="rename"]').click();
    await page.locator('#renameTrackInput').fill('Drums');
    await page.locator('#saveTrackName').click();

    // Moving and resizing clips changes the project model and does not trigger an accidental editor open.
    const firstClip = page.locator('#tracks .clip').first();
    const leftBefore = await firstClip.evaluate(el => el.style.left);
    const clipBox = await firstClip.boundingBox();
    await page.mouse.move(clipBox.x + clipBox.width/2, clipBox.y + clipBox.height/2);
    await page.mouse.down();
    await page.mouse.move(clipBox.x + clipBox.width/2 + 15, clipBox.y + clipBox.height/2, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(80);
    const leftAfter = await page.locator('#tracks .clip').first().evaluate(el => el.style.left);
    assert(leftAfter !== leftBefore, `clip drag moves clip at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#timelineScreen').isVisible(), `dragging clip does not open editor at ${viewport.width}x${viewport.height}`);
    const widthBefore = await page.locator('#tracks .clip').first().evaluate(el => el.style.width);
    const handle = await page.locator('#tracks .clip-resize-handle').first().boundingBox();
    await page.mouse.move(handle.x + handle.width/2, handle.y + handle.height/2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width/2 + 18, handle.y + handle.height/2, { steps: 3 });
    await page.mouse.up();
    await page.waitForTimeout(80);
    const widthAfter = await page.locator('#tracks .clip').first().evaluate(el => el.style.width);
    assert(widthAfter !== widthBefore, `clip edge resizes duration at ${viewport.width}x${viewport.height}`);

    const clipsBeforeSplit = await page.locator('#tracks .clip').count();
    await page.locator('#timelineTools [data-timeline-tool="cut"]').click();
    const splitTarget = page.locator('#tracks .clip').first();
    const splitBox = await splitTarget.boundingBox();
    await page.mouse.click(splitBox.x + splitBox.width*0.45, splitBox.y + splitBox.height/2);
    assert(await page.locator('#tracks .clip').count() === clipsBeforeSplit + 1, `Split tool divides one clip at ${viewport.width}x${viewport.height}`);

    // FL Studio Mobile-style clip controls: one tap shows controls; a quick second tap enters the editor.
    const bassClip = page.locator('#tracks .clip[data-clip="c2"]');
    await bassClip.click();
    assert(await page.locator('#clipContextMenu').isVisible(), `single tap opens clip controls at ${viewport.width}x${viewport.height}`);
    await bassClip.click();
    assert(await page.locator('#pianoScreen').isVisible(), `double tap opens the MIDI editor at ${viewport.width}x${viewport.height}`);
    await page.locator('.dock button[data-screen="timeline"]').click();

    // Copy and delete are real project-model operations, not inert buttons.
    const drumsClip = page.locator('#tracks .clip[data-clip="c1"]');
    const clipsBeforeCopy = await page.locator('#tracks .clip').count();
    await drumsClip.click();
    await page.locator('#clipContextMenu [data-clip-action="copy"]').click();
    assert(await page.locator('#tracks .clip').count() === clipsBeforeCopy + 1, `clip Copy duplicates a clip at ${viewport.width}x${viewport.height}`);
    const copiedClip = page.locator('#tracks .clip').filter({hasText:'Drum Loop Copy'}).first();
    await copiedClip.click();
    await page.locator('#clipContextMenu [data-clip-action="delete"]').click();
    assert(await page.locator('#tracks .clip').count() === clipsBeforeCopy, `clip Delete removes the copied clip at ${viewport.width}x${viewport.height}`);

    await page.reload({waitUntil:'networkidle'});

    await page.locator('.dock button[data-screen="piano"]').click();
    const initialNotes = await page.locator('#pianogrid .note').count();
    const grid = await page.locator('#pianogrid').boundingBox();
    await page.mouse.click(grid.x + grid.width*0.72, grid.y + grid.height*0.36);
    assert(await page.locator('#pianogrid .note').count() === initialNotes+1, `tap empty Piano Roll cell adds a note at ${viewport.width}x${viewport.height}`);
    const newNote = page.locator('#pianogrid .note').last();
    const noteLeftBefore = await newNote.evaluate(el=>el.style.left), noteTopBefore = await newNote.evaluate(el=>el.style.top);
    const noteBox = await newNote.boundingBox(), gridBox = await page.locator('#pianogrid').boundingBox();
    await page.mouse.move(noteBox.x + noteBox.width/2, noteBox.y + noteBox.height/2);
    await page.mouse.down();
    await page.mouse.move(noteBox.x + noteBox.width/2 - gridBox.width/16, noteBox.y + noteBox.height/2 - gridBox.height/12, {steps:3});
    await page.mouse.up();
    await page.waitForTimeout(80);
    const noteLeftAfter = await page.locator('#pianogrid .note').last().evaluate(el=>el.style.left), noteTopAfter=await page.locator('#pianogrid .note').last().evaluate(el=>el.style.top);
    assert(noteLeftAfter !== noteLeftBefore && noteTopAfter !== noteTopBefore, `dragging a Piano Roll note changes pitch and time at ${viewport.width}x${viewport.height}`);
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
