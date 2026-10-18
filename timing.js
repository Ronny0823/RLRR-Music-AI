/* Heuristic Spanish lyric timing. Estimates an arrangement, not sung alignment. */
(() => {
  'use strict';
  const syllablesPerBeat = { bachata:1.5, merengue:1.8, balada:1.8, cumbia:1.4, libre:1.6 };
  const clean = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function estimate({lyrics='',genre='bachata',bpm=128}={}) {
    if(!Object.hasOwn(syllablesPerBeat,genre)||!Number.isFinite(+bpm)||+bpm<60||+bpm>180)throw Error('Ritmo inválido.');
    const sections=[];let current={label:'',lines:[],repeat:1};
    for(const raw of String(lyrics).split(/\r?\n/)) {
      const line=raw.trim();if(!line)continue;
      const heading=line.match(/^\[([^\]]+)\]$/)||line.match(/^\(([^)]+)\)$/)||line.match(/^(intro|verso(?:\s+\d+)?|coro(?:\s+final)?|pre[- ]?coro|puente|outro|estribillo|instrumental|solo)\s*:\s*$/i);
      if(heading){if(current.label||current.lines.length)sections.push(current);const label=clean(heading[1]);const repeat=label.match(/(?:x|repetir\s+)([2-8])\b/);current={label,lines:[],repeat:repeat?+repeat[1]:1};}
      else current.lines.push(line.replace(/\[[^\]]*\]/g,''));
    }
    if(current.label||current.lines.length)sections.push(current);
    let beats=0,lineCount=0,chorusBeats=0;const explicitIntro=sections.some(s=>/^intro/.test(s.label)),explicitOutro=sections.some(s=>/^(outro|final instrumental)/.test(s.label));
    for(const section of sections) {
      let sectionBeats=0;
      for(const line of section.lines){const words=clean(line).match(/[a-zñ]+/g)||[];if(!words.length)continue;const syllables=words.reduce((sum,w)=>sum+Math.max(1,(w.match(/[aeiouy]+/g)||[]).length),0);sectionBeats+=Math.max(4,Math.ceil(syllables/syllablesPerBeat[genre]/4)*4);lineCount++;}
      const isChorus=/^(?:repetir\s+)?(?:coro|chorus|estribillo)\b/.test(section.label);
      if(!sectionBeats && isChorus && chorusBeats)sectionBeats=chorusBeats;
      if(!sectionBeats && /intro|outro|instrumental|solo|mambo|interludio/.test(section.label))sectionBeats=16;
      if(isChorus && sectionBeats)chorusBeats=sectionBeats;
      beats+=sectionBeats*section.repeat;
    }
    const hasLyrics=lineCount>0;
    if(!hasLyrics)beats=64; // Neutral 16-bar sketch when there is no lyric yet.
    else beats+=(explicitIntro?0:16)+(explicitOutro?0:16)+Math.max(0,sections.filter(s=>s.lines.length).length-1)*4;
    const bars=Math.ceil(beats/4),duration=Math.ceil(bars*4*60/bpm);
    return {duration,bars,lines:lineCount,hasLyrics,tooLong:duration>600,sections};
  }
  function format(seconds){return `${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
  globalThis.RLRRTiming={estimate,format};
})();
