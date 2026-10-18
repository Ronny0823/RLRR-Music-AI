# RLRR Music Studio

Estudio web estático independiente para RLRR. HTML, CSS y JavaScript sin paquetes externos, claves, bases de datos ni conexiones a proyectos anteriores. Listo para GitHub Pages.

## Qué funciona

- Editor de título, letra y estilo musical (máximo 1.000 caracteres para el estilo).
- Presets de bachata, merengue, balada y cumbia.
- Síntesis musical **procedimental, no IA**: bocetos instrumentales con duración automática estimada según la extensión de la letra, sus secciones, el género y el BPM; ritmo ajustable y descarga WAV mono a 22.050 Hz. El género y BPM controlan el arreglo. La letra se analiza mediante una heurística de sílabas y compases para estimar la duración; no se canta y no hay alineación vocal. Coros marcados sin texto reutilizan la duración del coro anterior; las etiquetas x2 a x8 repiten la sección. Se añaden espacios de introducción y cierre. Sin letra se crean 16 compases. Las instrucciones del estilo no se interpretan. El límite de renderizado es 10 minutos: si la estimación lo supera, se informa y se pide acortar la letra, sin recortar el audio silenciosamente. El texto completo puede guardarse y exportarse. No son grabaciones de instrumentos reales.
- Abrir y reproducir audio del dispositivo, sin subirlo a ningún servicio.
- Guardar y abrir proyectos en localStorage del navegador, con exportación/importación JSON y exportación TXT de letra y estilo.

## Generación con ACE-Step 1.5 XL

Crear canción con voz envía letra completa, estilo, BPM automático y duración estimada a la [demo oficial de ACE-Step 1.5](https://huggingface.co/spaces/ACE-Step/Ace-Step-v1.5). Usa `acestep-v15-xl-turbo`, 8 pasos, español, planificación activada y una muestra FLAC. Hasta 600 segundos en una sola solicitud: no se concatenan generaciones independientes. No hay servidor, base de datos, claves ni servicio de pago en esta integración.

La cola Gradio se descubre desde `/config`; se comprueban sus 54 entradas, incluidos los estados internos. El cliente conserva el audio de las actualizaciones del generador hasta su finalización, muestra errores y cuotas, y no reintenta automáticamente ni sustituye el motor por una unión de fragmentos.

La cuota gratuita y disponibilidad dependen de Hugging Face. Una denegación por cuota impide generar: cambiar de versión no aumenta esa cuota. No se garantiza pronunciación, fidelidad a toda la letra, duración exacta ni calidad equivalente a Suno. La verificación de conexión no acredita calidad audible.

El resultado se prepara como WAV estéreo a 48 kHz con corrección de componente continua, atenuación de picos y fundidos mínimos de borde. Esto no elimina defectos de voz ni de composición. Si el navegador no puede convertir FLAC, se ofrece el original con su extensión correcta. La conversión a WAV no mejora por sí sola el sonido del modelo.

Detener espera cierra la conexión local; el proveedor puede continuar procesando. Tiempo máximo de espera: 10 minutos. Los audios deben descargarse por separado. Los proyectos se guardan al pulsar Guardar proyecto en localStorage; los respaldos JSON contienen letras y ajustes, no audio. Borrar datos del navegador o cambiar de dispositivo no conserva los proyectos locales.

GitHub Pages sirve los archivos estáticos. Solo la generación con voz envía letras y ajustes a la demo externa. El boceto instrumental local sigue disponible como función separada.
