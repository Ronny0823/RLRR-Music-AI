/* Local style hints. The complete, unmodified style is still sent to the music model. */
(() => {
  'use strict';
  const profiles=[
    ['bachata','Bachata',128,/\bbachata\b/g],['merengue','Merengue',150,/\b(?:merengue|tipico dominicano|perico ripiao)\b/g],
    ['cumbia','Cumbia',94,/\bcumbia\b/g],['balada','Balada',76,/\b(?:balada|ballad)\b/g],
    ['libre','Salsa',170,/\bsalsa\b/g],['libre','Vallenato',95,/\bvallenato\b/g],
    ['libre','Ranchera',90,/\b(?:ranchera|mariachi)\b/g],['libre','Bolero',76,/\bbolero\b/g],
    ['libre','Reguetón',95,/\b(?:reggaeton|regueton)\b/g],['libre','Dembow',115,/\bdembow\b/g],
    ['libre','Pop',105,/\bpop\b/g],['libre','Rock',120,/\brock\b/g],
    ['libre','Trap',75,/\btrap\b/g],['libre','Hip hop',90,/\b(?:hip hop|rap)\b/g],
    ['libre','Jazz',100,/\bjazz\b/g],['libre','Electrónica',125,/\b(?:edm|electronica|techno|house)\b/g]
  ];
  const clean=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function excluded(text,index){const before=text.slice(Math.max(0,index-55),index);return /\b(?:sin|ni|no|not|without|evitar|excluir|nada de|no quiero|no usar)\s+(?:[a-z]+\s+){0,2}$/.test(before);}
  function detect(style){
    const text=clean(style),hits=[];
    for(const [genre,label,bpm,pattern] of profiles){pattern.lastIndex=0;let match;while((match=pattern.exec(text))){if(!excluded(text,match.index)){hits.push({genre,label,bpm,index:match.index});break;}}}
    hits.sort((a,b)=>a.index-b.index);
    const first=hits[0]||{genre:'libre',label:'Estilo libre',bpm:100};
    const explicit=[...text.matchAll(/\b(\d{2,3})\s*(?:bpm|pulsos por minuto)\b|\bbpm\s*[:=]?\s*(\d{2,3})\b/g)].find(match=>!excluded(text,match.index));
    const requestedBpm=explicit?+(explicit[1]||explicit[2]):null;
    let bpm=requestedBpm===null?first.bpm:Math.min(180,Math.max(60,requestedBpm));
    if(requestedBpm===null){if(/\b(?:muy lento|muy lenta|slow|despacio)\b/.test(text))bpm=Math.max(60,bpm-15);else if(/\b(?:lento|lenta)\b/.test(text))bpm=Math.max(60,bpm-8);else if(/\b(?:rapido|rapida|fast|acelerado)\b/.test(text))bpm=Math.min(180,bpm+15);}
    let voice='Voz según tu estilo';
    const voiceHints=[['Dueto',/\b(?:dueto|duo|duet)\b/g],['Voz femenina',/\b(?:femenina|female|mujer)\b/g],['Voz masculina',/\b(?:masculina|male|hombre)\b/g]];
    for(const [label,pattern] of voiceHints){if([...text.matchAll(pattern)].some(match=>!excluded(text,match.index))){voice=label;break;}}
    return{genre:first.genre,label:hits.length>1?hits.map(h=>h.label).join(' + '):first.label,bpm,voice,explicitBpm:requestedBpm!==null,clamped:requestedBpm!==null&&requestedBpm!==bpm};
  }
  globalThis.RLRRSound={detect};
})();
