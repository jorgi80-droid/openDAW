/* Native low-latency voice bridge (Android Oboe). Melvox continues using its existing WebAudio graph for full project playback. */
(() => {
  const native = window.StudioWaveAudio;
  if (!native) return;
  const api = window.StudioWaveAudioBridge = {
    ready: false,
    start() { try { this.ready = !!native.start(); return this.ready; } catch (_) { return false; } },
    noteOn(midi, velocity=0.8) {
      if (!this.ready && !this.start()) return false;
      const m = Number(midi);
      if (!Number.isFinite(m) || m < 0 || m > 127) return false;
      native.noteOn(440 * Math.pow(2, (m - 69) / 12), Math.max(0, Math.min(1, Number(velocity) || 0)));
      return true;
    },
    stop() { try { native.allNotesOff(); native.stop(); } catch (_) {} this.ready = false; },
    engine() { try { return native.engine(); } catch (_) { return 'Native audio unavailable'; } }
  };
  // A small fixed native-test trigger lets Android users verify that the Oboe stream is audible.
  const root = document.createElement('button');
  root.type='button'; root.id='oboeAudioTestButton'; root.textContent='♪ Oboe Test';
  root.setAttribute('aria-label','Test audio native Oboe');
  Object.assign(root.style,{position:'fixed',right:'8px',top:'8px',zIndex:'10000',minHeight:'30px',padding:'4px 9px',border:'1px solid #34516a',borderRadius:'8px',background:'#132232',color:'#bde8ff',font:'600 11px system-ui',opacity:'.94'});
  root.addEventListener('pointerdown',e=>{e.preventDefault(); if(api.noteOn(69,.45)) setTimeout(()=>api.noteOn(76,.45),180); setTimeout(()=>api.stop(),550);});
  document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(root),{once:true});
  if(document.readyState!=='loading') document.body.appendChild(root);
  // Child Melvox workspace can request a note over the same WebView bridge.
  window.addEventListener('message',e=>{
    if(!e.data||e.data.source!=='studiowave-melvox-audio')return;
    if(e.data.type==='note')api.noteOn(e.data.midi,e.data.velocity);
    if(e.data.type==='stop')api.stop();
  });
})();
