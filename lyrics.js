/* Conservative extraction: explicit document labels, never guessed from song meaning. */
(() => {
  'use strict';
  const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const unwrap=s=>s.trim().replace(/^#{1,6}\s+|^>\s?/g,'').replace(/\*\*|__/g,'').trim();
  const section=/^(?:intro(?:duccion)?|verso|estrofa|verse|coro|chorus|estribillo|pre[- ]?coro|pre[- ]?chorus|puente|bridge|outro|final instrumental|instrumental|solo|interludio|mambo)(?:\s+(?:\d+|final|x[2-8]|repetir\s+[2-8]))*(?:\s*[-–—:].*)?$/i;
  const label=/^(titulo(?: de (?:la )?cancion)?|title|estilo(?: musical| para suno)?(?:\s*\([^)]*\))?|genero(?: musical)?|ritmo|bpm|duracion|voz|descripcion(?: para youtube| de youtube)?|etiquetas|hashtags|tags|miniatura|comentario fijado|creditos|letra(?: (?:de la cancion|completa|original))?|lyrics|cancion\s*#?\s*\d+)\s*(?::|[-–—]\s|$)\s*(.*)$/i;
  function extract(text){
    const raw=String(text).replace(/\r\n?/g,'\n'),lines=raw.split('\n');
    const kinds=lines.map(line=>{const t=unwrap(line),normalized=fold(t.replace(/^[🎵🎶🎤✦✨📌📝🎼]+\s*/u,''));return{t,normalized,match:normalized.match(label)};});
    const hasLyricLabel=kinds.some(x=>x.match&&/^(letra|lyrics)/.test(x.match[1]));
    let mode=hasLyricLabel?'outside':'lyrics',title='',removed=0;const out=[];
    for(const x of kinds){
      if(/^\s*```/.test(x.t)||/^[-_*]{3,}$/.test(x.t)){removed++;continue;}
      const sectionText=x.normalized.replace(/^[[(]|[\])]$/g,'').replace(/:\s*$/,'');
      if(section.test(sectionText)){mode='lyrics';out.push(`[${x.t.replace(/^[[(]|[\])]$/g,'').replace(/:\s*$/,'')}]`);continue;}
      if(x.match){
        const name=x.match[1],content=x.t.slice(x.t.length-x.match[2].length);
        if(/^(letra|lyrics)/.test(name)){mode='lyrics';if(content)out.push(content);}
        else {if(/^titulo|^title/.test(name)&&content)title=content.replace(/^["“]|["”]$/g,'');mode=/^(titulo|title|cancion)/.test(name)?(hasLyricLabel?'outside':'lyrics'):/^(estilo|genero|ritmo|bpm|duracion|voz)/.test(name)?'metadata':'outside';}
        removed++;continue;
      }
      if(mode==='metadata'&&!x.t){mode=hasLyricLabel?'outside':'lyrics';continue;}
      if(mode!=='lyrics'){if(x.t)removed++;continue;}
      if(/^\s*(?:https?:\/\/|#[\p{L}\d_]+(?:\s+#[\p{L}\d_]+)*\s*$)/u.test(x.t)){removed++;continue;}
      out.push(x.t);
    }
    const lyrics=out.join('\n').replace(/\n{3,}/g,'\n\n').trim();
    return{lyrics,title:title.slice(0,120),changed:lyrics!==raw.trim(),removed};
  }
  globalThis.RLRRLyrics={extract};
})();
