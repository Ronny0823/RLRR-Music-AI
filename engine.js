/* Local procedural sketch synthesizer. No neural model, network, samples or vocals. */
(() => {
  'use strict';
  const rate = 22050;
  const presets = {
    bachata: { bpm:128, chords:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]], melody:[76,79,81,79,76,74,72,71] },
    merengue: { bpm:150, chords:[[60,64,67],[65,69,72],[67,71,74],[60,64,67]], melody:[76,79,84,83,81,79,77,76] },
    balada: { bpm:76, chords:[[57,60,64],[53,57,60],[48,52,55],[55,59,62]], melody:[76,74,72,71,69,72,74,76] },
    cumbia: { bpm:94, chords:[[57,60,64],[55,59,62],[53,57,60],[52,56,59]], melody:[81,79,76,74,72,74,76,79] }
  };
  const hz = n => 440 * 2 ** ((n-69)/12);
  function randomFor(text) {
    let value = 2166136261;
    for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return () => { value |= 0; value = value + 0x6D2B79F5 | 0; let t = Math.imul(value ^ value >>> 15, 1 | value); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function wav(samples) {
    const buffer = new ArrayBuffer(44 + samples.length * 2), v = new DataView(buffer);
    const put = (offset, s) => { for(let i=0;i<s.length;i++)v.setUint8(offset+i,s.charCodeAt(i)); };
    put(0,'RIFF'); v.setUint32(4,36+samples.length*2,true); put(8,'WAVE'); put(12,'fmt ');
    v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);
    v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);put(36,'data');v.setUint32(40,samples.length*2,true);
    for(let i=0;i<samples.length;i++)v.setInt16(44+i*2,Math.max(-1,Math.min(1,samples[i]))*32767,true);
    return new Blob([buffer],{type:'audio/wav'});
  }
  function render({genre='bachata',bpm=128,duration=24,seed='RLRR'}={}) {
    if(!presets[genre] || !Number.isFinite(+bpm) || +bpm<60 || +bpm>180 || (!Number.isFinite(+duration) || +duration<12 || +duration>600))throw Error('Parámetros de audio inválidos.');
    const p=presets[genre], random=randomFor(String(seed)), samples=new Float32Array(Math.round(duration*rate)), beat=60/bpm;
    function tone(time,note,len,amp,kind='pluck') {
      const start=Math.round(time*rate), count=Math.min(Math.round(len*rate),samples.length-start), f=hz(note);
      for(let i=0;i<count;i++) {
        const t=i/rate, phase=2*Math.PI*f*t;
        let envelope=Math.min(1,t/.006)*Math.min(1,(len-t)/.05), sound;
        if(kind==='bass'){sound=Math.sin(phase)+.12*Math.sin(phase*2);envelope*=Math.exp(-t*4);}
        else if(kind==='pad'){sound=Math.sin(phase)+.2*Math.sin(phase*2);envelope*=Math.min(1,t/.12)*.7;}
        else if(kind==='reed'){sound=Math.sin(phase)+.3*Math.sin(phase*2)+.15*Math.sin(phase*3);envelope*=Math.exp(-t*5);}
        else {sound=Math.sin(phase)+.3*Math.sin(phase*2)+.16*Math.sin(phase*3.002);envelope*=Math.exp(-t*(kind==='lead'?4:8));}
        samples[start+i]+=sound*envelope*amp;
      }
    }
    function drum(time,kind,amp) {
      const start=Math.round(time*rate),len=kind==='kick'?.18:kind==='bongo'?.13:.07,count=Math.min(Math.round(len*rate),samples.length-start);
      let last=0;
      for(let i=0;i<count;i++) {
        const t=i/rate,noise=random()*2-1;
        const sound=kind==='kick'?Math.sin(2*Math.PI*(52*t+1.4*(1-Math.exp(-t*30))))*Math.exp(-t*25):kind==='bongo'?Math.sin(2*Math.PI*185*t)*Math.exp(-t*35)+noise*.12*Math.exp(-t*80):(noise-last)*Math.exp(-t*65)*.35;
        samples[start+i]+=sound*amp*Math.min(1,t/.002);last=noise;
      }
    }
    for(let step=0;step*beat/2<duration;step++) {
      const time=step*beat/2,bar=Math.floor(step/8),pos=step%8,chord=p.chords[bar%4];
      if(pos%2===0)tone(time,chord[pos===4?2:0]-12,beat*.8,.22,'bass');
      if(genre==='balada') {
        if(pos===0)chord.forEach((n,i)=>tone(time+i*.018,n,beat*3.8,.06,'pad'));
        tone(time,chord[pos%3]+12,beat*1.5,.06);
        if(pos===0 || pos===4)drum(time,'kick',.11);
      } else {
        if(pos%2===1 || genre==='merengue')chord.forEach((n,i)=>tone(time+i*.012,n+(genre==='bachata'?12:0),beat*.8,.045,genre==='merengue'?'reed':'pluck'));
        drum(time,'shaker',.1);drum(time+beat/4,'shaker',.045);
        if(pos===0 || pos===4)drum(time,'kick',.25);
        if(pos===2 || pos===5 || pos===6)drum(time,'bongo',.16);
      }
      // Bounded melodic variations follow the current chord, never the lyric text.
      if(step>7 && (genre==='balada'?pos%2===0:random()>.22)) {
        const melodyNote=pos%4===0?chord[Math.floor(random()*3)]+24:p.melody[(step+Math.floor(random()*3))%p.melody.length];
        tone(time,melodyNote,beat*(genre==='balada'?1.8:.8),.075,genre==='merengue'?'reed':'lead');
      }
    }
    let peak=0;for(const s of samples)peak=Math.max(peak,Math.abs(s));
    const gain=peak>0?.88/peak:1;
    for(let i=0;i<samples.length;i++){const t=i/rate;samples[i]*=gain*Math.min(1,t/.04,(duration-t)/.8);}
    return wav(samples);
  }
  globalThis.RLRRAudio = { render, presets, rate };
  if(typeof WorkerGlobalScope!=='undefined' && globalThis instanceof WorkerGlobalScope)globalThis.onmessage=event=>{try{globalThis.postMessage({blob:render(event.data)});}catch(error){globalThis.postMessage({error:error.message});}};
})();
