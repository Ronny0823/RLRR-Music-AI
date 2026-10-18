/* Long lyrics use bounded generation requests; no lyric truncation. */
(() => {
  'use strict';
  function plan(project){
    const text=RLRRAI.prepareLyrics(project),units=[];let heading='[verse]';
    for(const line of text.split('\n')){
      if(/^\[.*\]$/.test(line.trim())){heading=line.trim();continue;}
      const words=line.trim().split(/\s+/).filter(Boolean);
      for(let i=0;i<words.length;i+=18){const content=words.slice(i,i+18).join(' ');units.push({heading,text:content,weight:Math.max(1,content.length)});}
    }
    if(!units.length)throw Error('Escribe la letra para crear la canción.');
    const total=units.reduce((sum,u)=>sum+u.weight,0);
    for(let count=Math.ceil(project.duration/200);count<=8;count++){
      const groups=[];let group=[],weight=0;
      for(const unit of units){if(group.length && weight+unit.weight>total/count && groups.length<count-1){groups.push(group);group=[];weight=0;}group.push(unit);weight+=unit.weight;}if(group.length)groups.push(group);
      const result=groups.map(group=>{let label='',lines=[];for(const unit of group){if(unit.heading!==label){lines.push(unit.heading);label=unit.heading;}lines.push(unit.text);}return{...project,lyrics:lines.join('\n'),duration:Math.max(12,Math.ceil(project.duration*group.reduce((sum,u)=>sum+u.weight,0)/total))};});
      if(result.every(p=>p.duration<=240))return result;
    }
    throw Error('No se pudo organizar esta letra en partes. Prueba a separar sus versos con saltos de línea.');
  }
  async function join(results,onStatus=()=>{}){
    if(results.length===1)return{blob:results[0].blob,extension:results[0].extension};
    return RLRRQuality.render(results,onStatus);
  }
  async function generate(project,{signal,onStatus=()=>{},generatePart}={}){
    const parts=plan(project),results=[];
    try{
      for(let index=0;index<parts.length;index++){
        if(signal?.aborted)throw signal.reason||new DOMException('Cancelado','AbortError');
        const prefix=`Parte ${index+1} de ${parts.length}: `;
        onStatus(`${prefix}preparando voz y música…`);
        results.push(await generatePart(parts[index],{signal,onStatus:message=>onStatus(prefix+message)}));
      }
      if(signal?.aborted)throw signal.reason||new DOMException('Cancelado','AbortError');
      return{...await join(results,onStatus),parts:parts.length};
    }catch(error){
      if(results.length){try{error.partial={...await join(results),completed:results.length,total:parts.length};}catch{error.partial={...results[0],completed:1,total:parts.length};}}
      throw error;
    }
  }
  globalThis.RLRRLong={plan,join,generate};
})();
