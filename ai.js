/* ACE-Step's public Gradio demo. No API keys, proxy or database. */
(() => {
  'use strict';
  const base='https://ace-step-ace-step-v1-5.hf.space';
  const genrePrompts={
    libre:'Music following the user musical style exactly, original composition',
    bachata:'Dominican bachata, expressive requinto lead guitar, rhythm guitar, bongo, guira, warm bass, emotional male lead singer, heartfelt Spanish singing',
    merengue:'Dominican merengue, tambora, guira, energetic brass, rhythmic bass, lively male lead singer and backing vocals, Spanish singing',
    balada:'Romantic Latin ballad, warm piano, acoustic guitar, gentle drums, expressive emotional male lead singer, Spanish singing',
    cumbia:'Traditional Caribbean cumbia, gaita flutes, tambora, alegre, llamador, maracas, warm bass, male lead singer and community backing vocals, Spanish singing'
  };
  function tag(label){
    if(/pre[- ]?coro/.test(label))return 'pre-chorus';
    if(/coro|chorus|estribillo/.test(label))return 'chorus';
    if(/verso|estrofa|verse/.test(label))return 'verse';
    if(/puente|bridge/.test(label))return 'bridge';
    if(/outro|final instrumental/.test(label))return 'outro';
    if(/intro/.test(label))return 'intro';
    if(/solo|instrumental|interludio|mambo/.test(label))return 'instrumental';
    return label.replace(/[\[\]]/g,'')||'verse';
  }
  function prepareLyrics(project){
    const sections=RLRRTiming.estimate({...project,lyrics:RLRRLyrics.extract(project.lyrics).lyrics}).sections;let previousChorus=[];const blocks=[];
    for(const section of sections){const name=tag(section.label);let lines=section.lines.filter(line=>line.trim());if(name==='chorus'){if(lines.length)previousChorus=lines;else lines=previousChorus;}if(!lines.length&&!['intro','outro','instrumental'].includes(name))continue;for(let n=0;n<section.repeat;n++)blocks.push(`[${name}]\n${lines.join('\n')}`);}
    return blocks.join('\n\n');
  }
  function readableError(value){
    const raw=typeof value==='string'?value:JSON.stringify(value||'');
    if(/quota|exceeded|zerogpu|gpu.*limit|rate.?limit|too many/i.test(raw)){const wait=raw.match(/(?:try again in|retry after)\s+([0-9:]+)/i);return `El proveedor agotó la cuota gratuita de generación.${wait&&/[1-9]/.test(wait[1])?' Podrás reintentar en '+wait[1]+'.':' Espera a que se renueve la cuota.'} No se ha cobrado nada.`;}
    if(/queue.*full/i.test(raw))return 'La cola del proveedor está llena. Espera y vuelve a probar.';
    if(/sign.?in|log.?in|unauthorized|authentication|401|403/i.test(raw))return 'La demo requiere acceso o no acepta esta solicitud. Puedes abrir ACE-Step para revisar el acceso. No se ha cobrado nada.';
    return 'El motor no pudo terminar la canción. Conserva tu proyecto y vuelve a intentarlo más tarde.';
  }
  async function generateSingle(project,{signal,onStatus=()=>{}}={}){
    if(!genrePrompts[project.genre]||!project.lyrics.trim())throw Error('Escribe una letra para crear la canción cantada.');
    if(!Number.isFinite(project.duration)||project.duration<12||project.duration>600)throw Error('El motor admite hasta 10 minutos en una generación. Divide las letras más largas en proyectos.');
    const lyrics=prepareLyrics(project);
    const sound=RLRRSound.detect(project.style);
    const arrangement=genrePrompts[project.genre].replace(/, (?:emotional male lead singer|lively male lead singer and backing vocals|expressive emotional male lead singer|male lead singer and community backing vocals).*$/,'');
    const vocal=sound.voice==='Voz femenina'?'female lead singer, Spanish singing':sound.voice==='Voz masculina'?'male lead singer, Spanish singing':sound.voice==='Dueto'?'vocal duet, Spanish singing':'lead vocals following the user style, Spanish singing';
    const prompt=`${arrangement}, ${vocal}, ${project.bpm} BPM. ${project.style}. Clean studio recording, clear lead vocals, detailed natural instruments, balanced stereo mix, controlled peaks, subtle room ambience.`;
    // Raw Gradio inputs include five State components omitted from /gradio_api/info.
    let data;
    const controller=new AbortController();
    const abort=()=>controller.abort(signal?.reason);signal?.addEventListener('abort',abort,{once:true});
    if(signal?.aborted)abort();
    const timer=setTimeout(()=>controller.abort(new Error('La demo tardó más de 10 minutos. Vuelve a intentarlo más tarde.')),600000);
    let events;
    try{
      onStatus('Enviando letra y estilo a ACE-Step…');
      const sessionHash='rlrr_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2);
      const configResponse=await fetch(`${base}/config`,{credentials:'omit',signal:controller.signal});if(!configResponse.ok)throw Error('No se pudo consultar el motor musical. Vuelve a probar más tarde.');
      const config=await configResponse.json(),dependency=config.dependencies?.find(item=>item.api_name==='generation_wrapper');
      if(!Number.isInteger(dependency?.id)||dependency.inputs?.length!==54)throw Error('El proveedor cambió su interfaz. La conexión necesita actualizarse.');
      const components=new Map(config.components.map(item=>[item.id,item]));
      const inputs=dependency.inputs.map(id=>components.get(id));
      const expected={0:'models',4:'Prompt',5:'Lyrics',6:'BPM (optional)',9:'Vocal Language',10:'DiT Inference Steps',15:'Audio Duration (seconds)',16:'batch size',30:'Audio Format'};
      if(Object.entries(expected).some(([index,label])=>inputs[index]?.props?.label!==label)||[40,50,51,52,53].some(index=>inputs[index]?.type!=='state'))throw Error('El proveedor cambió los controles del motor. La conexión necesita actualizarse.');
      if(!inputs[0].props.choices.some(choice=>(Array.isArray(choice)?choice[1]:choice)==='acestep-v15-xl-turbo'))throw Error('El modelo musical XL no está disponible en este momento.');
      data=inputs.map(item=>item.type==='state'?null:(item.props.value??null));
      Object.assign(data,{0:'acestep-v15-xl-turbo',1:'custom',3:'es',4:prompt,5:lyrics,6:project.bpm,9:'es',10:8,11:7,12:true,13:'-1',15:project.duration,16:1,23:'text2music',30:'flac',32:true,37:false,38:false,39:false,49:false});
      const response=await fetch(`${base}/gradio_api/queue/join`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,fn_index:dependency.id,session_hash:sessionHash}),credentials:'omit',signal:controller.signal});
      if(!response.ok)throw Error(readableError(`${response.status} ${await response.text()}`));
      const job=await response.json();if(!/^[a-f0-9]{32}$/i.test(job.event_id||''))throw Error('El motor no devolvió una solicitud válida.');
      onStatus('En cola o creando voz, ritmo e instrumentos. Puede tardar varios minutos…');
      const file=await new Promise((resolve,reject)=>{
        events=new EventSource(`${base}/gradio_api/queue/data?session_hash=${encodeURIComponent(sessionHash)}`);
        let generatedFile;
        events.addEventListener('message',event=>{try{
          const message=JSON.parse(event.data);
          if(message.msg==='queue_full')throw Error(readableError('queue full'));
          if(!['process_generating','process_completed'].includes(message.msg))return;
          if(message.success===false||message.output?.error)throw Error(readableError(message.output?.error));
          let candidate=message.output?.data?.[0];
          for(let n=0;n<3&&candidate&&!candidate.url;n++)candidate=candidate.value||candidate.audio;
          if(candidate?.url){const url=new URL(candidate.url,base);if(url.origin!==base||!url.pathname.startsWith('/gradio_api/file='))throw Error('El motor devolvió una dirección inesperada.');generatedFile={url:url.href,name:candidate.orig_name||candidate.path};}
          if(message.msg==='process_completed'){
            if(!generatedFile)throw Error(readableError(message.output?.data?.[10]||'No audio'));
            resolve(generatedFile);
          }
        }catch(error){reject(error);}});
        events.addEventListener('error',event=>{events.close();reject(new Error(event.data?readableError(event.data):'La conexión con ACE-Step se interrumpió. Guarda tu proyecto y vuelve a probar.'));});
        controller.signal.addEventListener('abort',()=>{events.close();reject(controller.signal.reason||new DOMException('Cancelado','AbortError'));},{once:true});
        if(controller.signal.aborted){events.close();reject(controller.signal.reason||new DOMException('Cancelado','AbortError'));}
      });
      events?.close();onStatus('Descargando la canción terminada…');
      const audio=await fetch(file.url,{credentials:'omit',signal:controller.signal});if(!audio.ok)throw Error('La canción se creó, pero no pudo descargarse. Vuelve a intentarlo más tarde.');
      const blob=await audio.blob();if(blob.size<1000)throw Error('El motor devolvió un archivo de audio vacío.');
      return {blob,url:file.url,extension:/\.(flac|wav|mp3)(?:$|[?])/i.exec(file.name||file.url)?.[1]?.toLowerCase()||'flac'};
    }finally{clearTimeout(timer);events?.close();signal?.removeEventListener('abort',abort);}
  }
  async function generate(project,options={}){
    if(!Number.isFinite(project.duration)||project.duration>600)throw Error('La duración estimada supera 10 minutos. Divide esta letra en proyectos para continuar.');
    const original=await generateSingle(project,options);
    try{return{...original,...await RLRRQuality.render([original],options.onStatus)};}catch(error){if(options.signal?.aborted)throw error;return{...original,processed:false,audioQuality:'Audio original del motor',processingNote:'El navegador no pudo preparar el WAV. Se conserva el archivo original del motor.'};}
  }

  globalThis.RLRRAI={generate,generateSingle,prepareLyrics,readableError,base,maxDuration:600};
})();
