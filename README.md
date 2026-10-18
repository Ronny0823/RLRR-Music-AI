# RLRR Music Studio

Estudio web estático independiente para RLRR. HTML, CSS y JavaScript sin paquetes externos, claves, bases de datos ni conexiones a proyectos anteriores. Listo para GitHub Pages.

## Qué funciona

- Editor de título, letra y estilo musical (máximo 1.000 caracteres para el estilo).
- Presets de bachata, merengue, balada y cumbia.
- Síntesis musical **procedimental, no IA**: bocetos instrumentales con duración automática estimada según la extensión de la letra, sus secciones, el género y el BPM; ritmo ajustable y descarga WAV mono a 22.050 Hz. El género y BPM controlan el arreglo. La letra se analiza mediante una heurística de sílabas y compases para estimar la duración; no se canta y no hay alineación vocal. Coros marcados sin texto reutilizan la duración del coro anterior; las etiquetas x2 a x8 repiten la sección. Se añaden espacios de introducción y cierre. Sin letra se crean 16 compases. Las instrucciones del estilo no se interpretan. El límite de renderizado es 10 minutos: si la estimación lo supera, se informa y se pide acortar la letra, sin recortar el audio silenciosamente. El texto completo puede guardarse y exportarse. No son grabaciones de instrumentos reales.
- Abrir y reproducir audio del dispositivo, sin subirlo a ningún servicio.
- Guardar y abrir proyectos en localStorage del navegador, con exportación/importación JSON y exportación TXT de letra y estilo.

## Generación de canciones cantadas con ACE-Step

El botón **Crear canción con voz** envía la letra, el estilo, el género, el BPM y la duración estimada a la demo pública oficial de [ACE-Step](https://huggingface.co/spaces/ACE-Step/ACE-Step), alojada en Hugging Face. No requiere claves en esta integración. No se contrata ningún servicio, no se instala un modelo en GitHub ni se usa la cuenta de Suno del usuario.

La API de esta demo es ACE-Step v1, no ACE-Step 1.5. Se comprobó su firma pública `/gradio_api/info`, una generación real y la autorización CORS desde el origen de GitHub Pages. Se usa la cola pública de Gradio con POST y eventos SSE, consultando la firma actual del endpoint. Esto permite mostrar el motivo de rechazo del proveedor, incluida su cuota gratuita, en lugar de un error genérico. Se descarga el resultado al navegador. La disponibilidad, cuota gratuita y cola dependen del proveedor; puede denegar peticiones o cambiar su API. No hay garantía de reproducir exactamente la letra, duración, género o pronunciación, ni de igualar la calidad de Suno.

- Cada solicitud a la demo admite 240 segundos. Para letras de más de 4 minutos y hasta 10 minutos, la página divide automáticamente el texto completo en partes, genera cada parte con voz y música y une los audios en un WAV mono de 24 kHz. Se conservan las líneas y las repeticiones; no se recorta la letra. La voz, melodía o interpretación pueden cambiar entre las partes: no es una extensión musical continua garantizada. Si la cuota impide terminar, se identifica el resultado como parcial y se ofrece el audio ya completado, sin anunciar una canción completa.
- Versos, coros y otras secciones se traducen a etiquetas del modelo; las repeticiones explícitas se expanden antes de enviarlas.
- Los mensajes de progreso y error son visibles y no se sustituyen por un boceto falso si el servidor falla.
- **Detener espera** cierra la conexión en esta página; la demo puede continuar el trabajo remoto. La espera máxima es de 10 minutos.
- El archivo de audio se descarga por separado: los respaldos JSON conservan letras y ajustes, no los audios. El archivo alojado por la demo es temporal.
- Sigue disponible un botón separado de bocetos instrumentales sintetizados localmente, sin IA ni voz.

## Publicar en GitHub Pages

En el repositorio, abrir **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → /(root) → Save**.

La dirección prevista, una vez que GitHub complete la publicación, es:
https://Ronny0823.github.io/RLRR-Music-AI/

No hacen falta Actions ni instalar paquetes. `.nojekyll` permite servir directamente estos archivos.

## Uso local

Abrir `index.html` en un navegador moderno. También se puede servir la carpeta con `python3 -m http.server 8080`.

Los proyectos se guardan solo al pulsar **Guardar proyecto**. Exportar periódicamente una copia: borrar datos del navegador o cambiar de dispositivo no conserva localStorage. Los audios se descargan por separado y no forman parte del respaldo JSON. No hay sincronización entre dispositivos. La edición, los proyectos y los bocetos instrumentales locales funcionan en el dispositivo. Solo al crear la canción con voz se envían la letra y los ajustes a la demo externa y se descarga su resultado. GitHub sirve los archivos y recibe las visitas normales de la página.

La duración se recalcula al cambiar la letra, el género o el ritmo, y al abrir proyectos antiguos. Las copias anteriores siguen siendo compatibles; sus duraciones manuales se sustituyen por el cálculo automático. El audio se sintetiza en un Web Worker para mantener disponible la interfaz durante bocetos largos.

## Visualización del resultado

Al recibir el audio se abre automáticamente un reproductor sobre la página, también en móviles. Incluye título, controles de reproducción y descarga. Puede cerrarse y reabrirse con «Escuchar mi canción» o con el botón fijo «Tu canción está lista». Durante la generación se muestra un aviso fijo de progreso. La reproducción requiere pulsar el botón para respetar las restricciones de audio de los navegadores móviles.

La ruta para letras largas utiliza el mismo motor v1 previamente comprobado. La demo v1.5 fue evaluada pero no se añadió porque su solicitud de GPU excedió la cuota anónima disponible en la prueba.
