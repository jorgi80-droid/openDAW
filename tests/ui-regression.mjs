import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = 'artifacts/ui-regression';
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const assert = (ok, message) => { console.log((ok ? 'PASS ' : 'FAIL ') + message); if (!ok) failures.push(message); };
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 854, height: 480 }, { width: 720, height: 360 }]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: false });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto('http://127.0.0.1:4173/app-shell/index.html', { waitUntil: 'networkidle' });
    await page.waitForSelector('#timelineScreen');
    // Home / Settings must change real workspace scale, theme and timeline snap behavior.
    await page.locator('#menu').click();
    assert(await page.locator('#settingsOverlay').isVisible(), `Home / Settings opens at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#settingsOverlay .home-project-actions button').count() === 5, `Home exposes new/save/open/import/export project actions at ${viewport.width}x${viewport.height}`);
    assert((await page.locator('#homeProjectSummary').innerText()).includes('BPM') && (await page.locator('#homeProjectSummary').innerText()).includes('track'), `Home shows current project summary at ${viewport.width}x${viewport.height}`);
    await page.locator('#uiScale').evaluate(el=>{el.value='70';el.dispatchEvent(new Event('input',{bubbles:true}))});
    assert(await page.locator('.app').evaluate(el=>getComputedStyle(el).zoom)==='1' && await page.locator('html').evaluate(el=>getComputedStyle(el).getPropertyValue('--ui-scale').trim())==='0.7', `UI Scale adjusts typography without shrinking the workspace canvas at ${viewport.width}x${viewport.height}`);
    await page.locator('#uiScale').evaluate(el=>{el.value='85';el.dispatchEvent(new Event('input',{bubbles:true}))});
    await page.locator('#uiTheme').selectOption('midnight');
    assert(await page.locator('html').getAttribute('data-theme')==='midnight', `theme setting applies at ${viewport.width}x${viewport.height}`);
    await page.locator('#uiTheme').selectOption('dark');
    await page.locator('#gridSnap').selectOption('eighth');
    assert(await page.locator('#gridSnap').inputValue()==='eighth', `timeline snap subdivision is selectable at ${viewport.width}x${viewport.height}`);
    await page.locator('#closeSettingsDone').click();
    const transportGeometry=await page.evaluate(()=>{const bar=document.querySelector('.transportbar').getBoundingClientRect(),controls=document.querySelector('.transportbar .transport').getBoundingClientRect(),play=document.querySelector('#play').getBoundingClientRect();return {barCenter:bar.left+bar.width/2,controlsCenter:controls.left+controls.width/2,playCenter:play.left+play.width/2,height:bar.height,play};});
    assert(Math.abs(transportGeometry.barCenter-transportGeometry.controlsCenter)<=2, `transport layout is centered in its compact control strip at ${viewport.width}x${viewport.height}`);
    assert(Math.abs(transportGeometry.barCenter-transportGeometry.playCenter)<=2, `Play/Pause button itself is exactly centered at ${viewport.width}x${viewport.height}`);
    assert(transportGeometry.height<=36 && transportGeometry.play.width>=30, `transport strip stays compact while Play remains touchable at ${viewport.width}x${viewport.height}`);
    const dims = await page.evaluate(() => {
      const box = s => { const r=document.querySelector(s).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,top:r.top,right:r.right}; };
      return {workspace:box('#workspace'),dock:box('.dock'),timeline:box('#timelineScreen .timeline'),rowCount:document.querySelectorAll('#tracks .trackrow').length,visibleScreenCount:[...document.querySelectorAll('.screen')].filter(el=>getComputedStyle(el).display!=='none').length};
    });
    assert(dims.visibleScreenCount === 1, `one active workspace at ${viewport.width}x${viewport.height}`);
    assert(dims.workspace.right <= dims.dock.x + 1, `workspace and right-side dock do not overlap at ${viewport.width}x${viewport.height}; workspace=${JSON.stringify(dims.workspace)}, dock=${JSON.stringify(dims.dock)}`);
    assert(dims.timeline.height > 160 && dims.timeline.width > 300, `timeline has usable dimensions at ${viewport.width}x${viewport.height}`);
    assert(dims.rowCount >= 6, `all six starter tracks rendered at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#timelineTools').isVisible(), `timeline edit rail is visible at ${viewport.width}x${viewport.height}`);
    const gridVisible = await page.locator('#tracks .clip-canvas').first().evaluate(el => { const bg=getComputedStyle(el).backgroundImage; return bg.includes('linear-gradient') && bg !== 'none'; });
    assert(gridVisible, `Timeline beat/bar grid is drawn on the scrollable clip canvas at ${viewport.width}x${viewport.height}`);
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
    // Compact UI preferences must be accessible and apply without route loss.
    await page.locator('#menu').click();
    assert(await page.locator('#settingsOverlay').isVisible(), `menu opens Settings at ${viewport.width}x${viewport.height}`);
    await page.locator('#uiScale').evaluate(el=>{el.value='80';el.dispatchEvent(new Event('input',{bubbles:true}));});
    assert(await page.locator('#uiScaleValue').innerText() === '80%', `UI Scale control updates its value at ${viewport.width}x${viewport.height}`);
    await page.locator('#uiTheme').selectOption('midnight');
    assert(await page.locator('html').getAttribute('data-theme') === 'midnight', `theme selection updates UI preference at ${viewport.width}x${viewport.height}`);
    await page.locator('#closeSettingsDone').click();
    assert(await page.locator('#settingsOverlay').isHidden(), `Settings closes cleanly at ${viewport.width}x${viewport.height}`);
    await page.locator('#browserTabs button[data-cat="Samples"]').click();
    const browserTabHeight = await page.locator('#browserTabs button').first().evaluate(el=>el.getBoundingClientRect().height);
    assert(browserTabHeight <= 32, `Browser category tabs stay compact at ${viewport.width}x${viewport.height}`);
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
    // The compact Channel Rack step row must be usable and isolated per track.
    await page.locator('#deviceTrackSelect').selectOption('0');
    await page.locator('#devTabs button[data-cat="Instrument"]').click();
    assert(await page.locator('#stepRackButtons [data-step-index]').count() === 16, `Channel Rack exposes 16 touch steps at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#stepRackButtons [data-step-index="0"]').getAttribute('aria-pressed') === 'true', `Drum track starts with a visible four-beat pattern at ${viewport.width}x${viewport.height}`);
    await page.locator('#stepRackButtons [data-step-index="1"]').click();
    assert(await page.locator('#stepRackButtons [data-step-index="1"]').getAttribute('aria-pressed') === 'true', `Channel Rack step toggles on at ${viewport.width}x${viewport.height}`);
    await page.locator('#deviceTrackSelect').selectOption('1');
    assert(await page.locator('#stepRackButtons [data-step-index="1"]').getAttribute('aria-pressed') === 'false', `Channel Rack patterns are isolated between tracks at ${viewport.width}x${viewport.height}`);
    await page.locator('#deviceTrackSelect').selectOption('0');
    assert(await page.locator('#stepRackButtons [data-step-index="1"]').getAttribute('aria-pressed') === 'true', `Channel Rack pattern persists when returning to a track at ${viewport.width}x${viewport.height}`);
    await page.locator('#devTabs button[data-cat="Effect"]').click();
    assert(await page.locator('#devices .device-option').count() === 6, `Devices Effect tab lists 6 effects at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#devices .device-editor').isVisible(), `Devices has one focused editor at ${viewport.width}x${viewport.height}`);
    const deviceKeyboardSeparated=await page.locator('#devices .device-editor').evaluate(el=>{const main=el.querySelector('.device-editor-main'),keyboard=el.querySelector('.mini-keyboard');if(!main||!keyboard)return true;return main.getBoundingClientRect().bottom<=keyboard.getBoundingClientRect().top+2;});
    assert(deviceKeyboardSeparated, `Devices editor controls and keyboard do not overlap at ${viewport.width}x${viewport.height}`);
    const deviceEditorBounds=await page.locator('#devices .device-editor').boundingBox();
    const deviceHeaderBounds=await page.locator('#devices .device-editor-header').boundingBox();
    const devicePagesBounds=await page.locator('#devices .device-page-tabs').boundingBox();
    const deviceMainBounds=await page.locator('#devices .device-editor-main').boundingBox();
    const deviceParamsBounds=await page.locator('#devices .knob-bank').boundingBox();
    const deviceGeometry={editor:deviceEditorBounds,header:deviceHeaderBounds,pages:devicePagesBounds,main:deviceMainBounds,params:deviceParamsBounds};
    const deviceGeometryOk=!!(deviceEditorBounds && deviceHeaderBounds && devicePagesBounds && deviceMainBounds && deviceParamsBounds &&
      deviceHeaderBounds.x>=deviceEditorBounds.x-1 && deviceHeaderBounds.x+deviceHeaderBounds.width<=deviceEditorBounds.x+deviceEditorBounds.width+1 &&
      devicePagesBounds.y>=deviceHeaderBounds.y+deviceHeaderBounds.height-1 &&
      deviceMainBounds.y>=devicePagesBounds.y+devicePagesBounds.height-1 &&
      deviceParamsBounds.x>=deviceMainBounds.x-1 && deviceParamsBounds.x+deviceParamsBounds.width<=deviceMainBounds.x+deviceMainBounds.width+1);
    assert(deviceGeometryOk, `Devices instrument/effect controls fit within the editor without horizontal clipping at ${viewport.width}x${viewport.height}; geometry=${JSON.stringify(deviceGeometry)}`);
    await page.locator('#devices [data-device-select="Delay"]').click();
    assert(await page.locator('#devices .effect-chain-item').count()===2, `Channel Rack effect selection adds a second processing module at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices [data-chain-up="1"]').click();
    const effectChainOrder=await page.locator('#devices .effect-chain-select').allTextContents();
    assert(effectChainOrder[0].includes('Delay'), `effect chain can reorder processing modules at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices [data-chain-remove="0"]').click();
    assert(await page.locator('#devices .effect-chain-item').count()===1, `effect chain can remove a module without removing the rack at ${viewport.width}x${viewport.height}`);
    const deviceLayout = await page.locator('#devices').evaluate(el => { const r=el.getBoundingClientRect(); const editor=el.querySelector('.device-editor')?.getBoundingClientRect(); const picker=el.querySelector('.device-picker')?.getBoundingClientRect(); return {height:r.height,editorHeight:editor?.height||0,pickerHeight:picker?.height||0}; });
    assert(deviceLayout.height > 130 && deviceLayout.editorHeight >= deviceLayout.height-4 && deviceLayout.pickerHeight >= deviceLayout.height-4, `Devices rack and editor fill the available panel at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices .device-page-tabs button[data-device-page=\"TIME\"]').click();
    assert(await page.locator('#devices .device-page-tabs button.active').innerText() === 'TIME', `device effect pages switch at ${viewport.width}x${viewport.height}`);
    // Rack identity is per track: choosing a different track must not reuse the same instrument selection.
    await page.locator('#devTabs button[data-cat="Instrument"]').click();
    await page.locator('#devices [data-device-select="Playfield Drums"]').click();
    await page.locator('#devices [data-device-keyboard]').click();
    assert(await page.locator('#devices .mini-drum-pads [data-drum-pad]').count() === 12, `Drum controller exposes 12 pads at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices .mini-drum-pads [data-drum-pad="0"]').click();
    assert((await page.locator('#toast').innerText()).includes('Drum pad Kick'), `Drum pad touch gives immediate feedback at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices [data-device-keyboard]').click();
    await page.locator('#devices [data-device-select="Nano Sampler"]').click();
    await page.locator('#deviceTrackSelect').selectOption('1');
    await page.locator('#deviceTrackLabel').waitFor({state:'visible'});
    assert((await page.locator('#deviceTrackLabel').innerText()).includes('Bass'), `Devices displays the selected track name at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#devices .device-editor h3').innerText() === 'Vaporisateur Synth', `each track retains its own instrument rack at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices [data-device-keyboard]').click();
    assert(await page.locator('#devices .mini-keyboard').isVisible(), `Devices keyboard opens on demand at ${viewport.width}x${viewport.height}`);
    await page.locator('#devices [data-device-keyboard]').click();
    assert(await page.locator('#devices .mini-keyboard').count() === 0, `Devices keyboard can be hidden to restore editor space at ${viewport.width}x${viewport.height}`);
    await page.locator('.dock button[data-screen="timeline"]').click();
    await page.locator('.dock button[data-screen="devices"]').click();
    assert((await page.locator('#deviceTrackLabel').innerText()).includes('Bass') && await page.locator('#devices .device-editor h3').innerText() === 'Vaporisateur Synth', `Devices refreshes the active track rack after route switching at ${viewport.width}x${viewport.height}`);
    await page.locator('#deviceTrackSelect').selectOption('0');
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

    // Start gestures from a deterministic, visible timeline position after the scroll-sync check.
    await page.locator('.bars-viewport').evaluate(el=>{el.scrollLeft=0;el.dispatchEvent(new Event('scroll',{bubbles:true}))});
    await page.locator('#tracks .cliparea').evaluateAll(els=>els.forEach(el=>{el.scrollLeft=0;el.dispatchEvent(new Event('scroll',{bubbles:true}))}));
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
    const splitCountAfter=await page.locator('#tracks .clip').count();
    const splitToast=await page.locator('#toast').textContent();
    assert(splitCountAfter === clipsBeforeSplit + 1, `Split tool divides one clip at ${viewport.width}x${viewport.height}; before=${clipsBeforeSplit}, after=${splitCountAfter}, toast=${splitToast}`);

    // FL Studio Mobile-style clip controls: one tap shows controls; a quick second tap enters the editor.
    const bassClip = page.locator('#tracks .clip[data-clip="c2"]');
    await bassClip.click();
    const contextVisible=await page.locator('#clipContextMenu').isVisible();
    assert(contextVisible, `single tap opens clip controls at ${viewport.width}x${viewport.height}; selected=${await page.locator('#clipContextMenu').getAttribute('data-clip-id')}, toast=${await page.locator('#toast').textContent()}`);
    await bassClip.click();
    assert(await page.locator('#pianoScreen').isVisible(), `double tap opens the MIDI editor at ${viewport.width}x${viewport.height}; contextHidden=${await page.locator('#clipContextMenu').evaluate(el=>el.hidden)}, toast=${await page.locator('#toast').textContent()}`);
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
    const timelineZoomBeforeWheel=await page.locator('#zoomLabel').textContent();
    await page.locator('#timelineScreen').dispatchEvent('wheel',{deltaY:-100,ctrlKey:true,bubbles:true,cancelable:true,clientX:300});
    assert(await page.locator('#zoomLabel').textContent()!==timelineZoomBeforeWheel, `Ctrl-wheel timeline zoom works at ${viewport.width}x${viewport.height}`);

    await page.reload({waitUntil:'networkidle'});

    await page.locator('.dock button[data-screen="piano"]').click();
    const initialNotes = await page.locator('#pianogrid .note').count();
    const grid = await page.locator('#pianogrid').boundingBox();
    await page.mouse.click(grid.x + grid.width*0.72, grid.y + grid.height*0.36);
    assert(await page.locator('#keys span').count() === 25, `Piano Roll shows all 25 chromatic keys from C6 to C4 at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#keys span').filter({hasText:'C#5'}).count() === 1 && await page.locator('#keys span').filter({hasText:'C#4'}).count() === 1, `Piano Roll includes both C-sharp rows at ${viewport.width}x${viewport.height}`);
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
    const dragDebug = await page.evaluate(()=>window.__pianoDragDebug||null);
    assert(noteLeftAfter !== noteLeftBefore && noteTopAfter !== noteTopBefore, `dragging a Piano Roll note changes pitch and time at ${viewport.width}x${viewport.height}; before=${noteLeftBefore}/${noteTopBefore}, after=${noteLeftAfter}/${noteTopAfter}, events=${JSON.stringify(dragDebug)}`);
    const resizeNote=page.locator('#pianogrid .note').last();
    const noteWidthBefore=await resizeNote.evaluate(el=>el.style.width);
    const resizeBox=await resizeNote.boundingBox();
    await page.mouse.move(resizeBox.x+resizeBox.width-2,resizeBox.y+resizeBox.height/2);
    await page.mouse.down();
    await page.mouse.move(resizeBox.x+resizeBox.width+Math.max(12,gridBox.width/64),resizeBox.y+resizeBox.height/2,{steps:3});
    await page.mouse.up();
    await page.waitForTimeout(60);
    const noteWidthAfter=await page.locator('#pianogrid .note').last().evaluate(el=>el.style.width);
    assert(noteWidthAfter!==noteWidthBefore, `dragging a Piano Roll note edge changes note length at ${viewport.width}x${viewport.height}`);
    const velocityBar=page.locator('#velocity span').last();
    const velocityHeightBefore=await velocityBar.evaluate(el=>el.style.height);
    const velocityBox=await velocityBar.boundingBox();
    const velocityLaneBox=await page.locator('#velocity').boundingBox();
    const velocityContainer=await page.locator('#velocity').boundingBox();
    assert(velocityBox && velocityContainer && velocityBox.x >= velocityContainer.x-1 && velocityBox.x+velocityBox.width <= velocityContainer.x+velocityContainer.width+1, `last velocity hit target is within visible lane at ${viewport.width}x${viewport.height}`);
    const velocityX=velocityBox.x+velocityBox.width/2;
    await page.mouse.move(velocityX,velocityBox.y+2);
    await page.mouse.down();
    await page.mouse.move(velocityX,velocityLaneBox.y+2,{steps:4});
    await page.mouse.up();
    const velocityHeightAfter=await page.locator('#velocity span').last().evaluate(el=>el.style.height);
    assert(velocityHeightAfter!==velocityHeightBefore, `dragging a Piano Roll velocity bar changes note velocity at ${viewport.width}x${viewport.height}`);
    const pianoVelocityAlignment=await page.locator('#pianogrid .note').last().evaluate(note=>{
      const notes=[...document.querySelectorAll('#pianogrid .note')],bars=[...document.querySelectorAll('#velocity span')];
      if(!notes.length||notes.length!==bars.length)return false;
      const nr=notes[notes.length-1].getBoundingClientRect(),br=bars[bars.length-1].getBoundingClientRect();
      return Math.abs(nr.left-br.left)<2 || Math.abs((nr.left+nr.width/2)-(br.left+br.width/2))<2;
    });
    assert(pianoVelocityAlignment, `Piano Roll velocity bars align to note start positions at ${viewport.width}x${viewport.height}`);
    const notesInside = await page.locator('#pianogrid .note').evaluateAll(notes => { const g=document.querySelector('#pianogrid .note-layer').getBoundingClientRect(); return notes.every(note => { const r=note.getBoundingClientRect(); return r.left>=g.left-1 && r.right<=g.right+1 && r.top>=g.top-1 && r.bottom<=g.bottom+1; }); });
    assert(notesInside, `all Piano Roll notes remain inside note grid at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#velocity span').count() === await page.locator('#pianogrid .note').count(), `velocity lane has one editable bar per MIDI note at ${viewport.width}x${viewport.height}`);
    const pianoWidthBefore=await page.locator('#pianogrid .note-layer').evaluate(el=>el.scrollWidth);
    await page.locator('#pianogrid').dispatchEvent('wheel',{deltaY:-100,ctrlKey:true,bubbles:true,cancelable:true,clientX:300});
    assert(await page.locator('#pianogrid .note-layer').evaluate(el=>el.scrollWidth)>pianoWidthBefore, `Ctrl-wheel Piano Roll zoom works at ${viewport.width}x${viewport.height}`);
    assert(pageErrors.length === 0, `no JavaScript exceptions at ${viewport.width}x${viewport.height}${pageErrors.length ? ': '+pageErrors.join('; ') : ''}`);
    for (const [route,id] of routes) {
      await page.locator('.dock button[data-screen="'+route+'"]').click();
      await page.locator('#toast').evaluate(el => { el.hidden = true; });
      await page.screenshot({ path:path.join(outDir,`${viewport.width}x${viewport.height}-${route}.png`), fullPage:true });
    }
    // Home panel project actions are real and must not disturb the workspace navigation.
    await page.locator('#menu').click();
    assert(await page.locator('#homeProjectSummary').innerText().then(s=>s.includes('BPM')&&s.includes('track')), `Home shows current project metadata at ${viewport.width}x${viewport.height}`);
    await page.locator('#homeSaveProject').click();
    const savedProject=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('novadaw-project')||'null')}catch(_){return null}});
    assert(savedProject && Array.isArray(savedProject.tracks), `Home Save persists a project model at ${viewport.width}x${viewport.height}`);
    await page.locator('#menu').click();
    page.once('dialog',dialog=>dialog.accept());
    await page.locator('#homeNewProject').click();
    assert(await page.locator('#projectName').inputValue()==='Untitled', `Home New Project updates the active project at ${viewport.width}x${viewport.height}`);
    assert(await page.locator('#tracks .clip').count()===0, `Home New Project clears starter clips at ${viewport.width}x${viewport.height}`);
    assert(pageErrors.length===0, `no JavaScript exceptions after Home actions at ${viewport.width}x${viewport.height}`);
    await context.close();
  }
} finally { await browser.close(); }
if (failures.length) { console.error(`UI regression failures: ${failures.length}`); process.exit(1); }
console.log('All NovaDAW browser regression tests passed.');
