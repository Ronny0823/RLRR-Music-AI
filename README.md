# RLRR Music Studio

Estudio web estático independiente para RLRR. HTML, CSS y JavaScript sin dependencias, cuentas, claves, bases de datos ni conexiones a proyectos anteriores. Listo para GitHub Pages.

## Qué funciona

- Editor de título, letra y estilo musical (máximo 1.000 caracteres para el estilo).
- Presets de bachata, merengue, balada y cumbia.
- Síntesis musical **procedimental, no IA**: bocetos instrumentales de 24, 40 o 60 segundos, ritmo ajustable y descarga WAV mono a 22.050 Hz. El género y BPM controlan el arreglo. La letra y las instrucciones del estilo no se cantan ni interpretan. No son grabaciones de instrumentos reales.
- Abrir y reproducir audio del dispositivo, sin subirlo a ningún servicio.
- Guardar y abrir proyectos en localStorage del navegador, con exportación/importación JSON y exportación TXT de letra y estilo.

## Pendiente: generación de canciones cantadas

**Esta versión no contiene un modelo de IA, no genera voces y no produce canciones terminadas como Suno.** El estado pendiente está visible en la página. GitHub Pages solo sirve los archivos de la web; hace falta elegir y conectar un motor de generación musical para esa función. No hay un botón que simule generar una canción ni se guardan claves privadas en la web. No se ha contratado ningún servicio.

## Publicar en GitHub Pages

En el repositorio, abrir **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main → /(root) → Save**.

La dirección prevista, una vez que GitHub complete la publicación, es:
https://Ronny0823.github.io/RLRR-Music-AI/

No hacen falta Actions ni instalar paquetes. `.nojekyll` permite servir directamente estos archivos.

## Uso local

Abrir `index.html` en un navegador moderno. También se puede servir la carpeta con `python3 -m http.server 8080`.

Los proyectos se guardan solo al pulsar **Guardar proyecto**. Exportar periódicamente una copia: borrar datos del navegador o cambiar de dispositivo no conserva localStorage. Los audios se descargan por separado y no forman parte del respaldo JSON. No hay sincronización entre dispositivos. Todo el procesamiento sucede localmente y la aplicación no realiza peticiones externas. GitHub sirve los archivos y recibe las visitas normales de la página.
