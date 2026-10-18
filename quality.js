/* Preserve the model's 48 kHz stereo output. No denoising or invented detail. */
(() => {
  'use strict';
  const rate=48000,channels=2;
  function pcm(decoded,{fadeStart=true,fadeEnd=true}={}){
    if(decoded.sampleRate!==rate||decoded.numberOfChannels<1)throw Error('El navegador no pudo preparar el audio estéreo.');
    const length=decoded.length,source=[decoded.getChannelData(0),decoded.getChannelData(Math.min(1,decoded.numberOfChannels-1))];
    const offsets=source.map(samples=>{let total=0;for(const value of samples)total+=value;return length?total/length:0;});
    let peak=0;for(let ch=0;ch<channels;ch++)for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(source[ch][i]-offsets[ch]));
    const gain=peak>.98?.98/peak:1,buffer=new ArrayBuffer(length*channels*2),view=new DataView(buffer),fade=Math.min(192,Math.floor(length/2));
    for(let i=0;i<length;i++){
      const envelope=Math.min(1,fadeStart&&fade?i/fade:1,fadeEnd&&fade?(length-1-i)/fade:1);
      for(let ch=0;ch<channels;ch++){const value=Math.max(-1,Math.min(1,(source[ch][i]-offsets[ch])*gain*envelope));view.setInt16((i*channels+ch)*2,Math.round(value*(value<0?32768:32767)),true);}
    }
    return new Uint8Array(buffer);
  }
  function wav(chunks){
    const size=chunks.reduce((sum,chunk)=>sum+chunk.byteLength,0);if(size>0xffffffff-36)throw Error('El archivo de audio es demasiado grande.');
    const header=new ArrayBuffer(44),v=new DataView(header),put=(offset,text)=>{for(let i=0;i<text.length;i++)v.setUint8(offset+i,text.charCodeAt(i));};
    put(0,'RIFF');v.setUint32(4,36+size,true);put(8,'WAVE');put(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,channels,true);v.setUint32(24,rate,true);v.setUint32(28,rate*channels*2,true);v.setUint16(32,channels*2,true);v.setUint16(34,16,true);put(36,'data');v.setUint32(40,size,true);
    return new Blob([header,...chunks],{type:'audio/wav'});
  }
  async function render(results,onStatus=()=>{}){
    const Context=globalThis.OfflineAudioContext||globalThis.webkitOfflineAudioContext;
    if(!Context)throw Error('Este navegador no permite preparar el WAV estéreo.');
    const context=new Context(channels,1,rate),chunks=[];
    for(let index=0;index<results.length;index++){
      onStatus(`Preparando audio estéreo ${index+1} de ${results.length}…`);
      const decoded=await context.decodeAudioData(await results[index].blob.arrayBuffer());
      chunks.push(pcm(decoded));
      // Each part is encoded before the next is decoded, avoiding a full-song float copy.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    return{blob:wav(chunks),extension:'wav',processed:true,audioQuality:'WAV estéreo · 48 kHz'};
  }
  globalThis.RLRRQuality={pcm,wav,render,rate,channels};
})();
