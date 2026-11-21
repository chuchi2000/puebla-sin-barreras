# Puebla sin barreras

Prototipo para el Claude Build Day Puebla (reto "Hecho en Puebla").
Frase: esto ayuda a personas en silla de ruedas a planear un recorrido por el Centro Histórico de Puebla sabiendo antes qué lugares pueden visitar sin barreras.

## Cómo trabajar
- Hay unas 2 horas de build. Primero que funcione, después lo pulimos.
- Si algo va a tardar más de 15 minutos, propón la versión más simple antes de hacerlo.
- Después de cada función que funcione, haz commit con un mensaje claro en español.
- Explica en 2 o 3 líneas qué cambiaste; no repitas el código en el chat.

## Stack
- Página estática: index.html, style.css, app.js, lugares.json, fotos/.
- Sin frameworks, sin paso de build, sin backend.
- Llave de la API: el usuario la pega en la app y se guarda en localStorage. Nunca va en el código ni en el repositorio.
- Mapa: Leaflet desde CDN (unpkg) con tiles de OpenStreetMap y su atribución.
- Probar con `python -m http.server 8000` y abrir http://localhost:8000. Con doble clic el fetch de lugares.json no funciona.
- Se publica en GitHub Pages.

## Datos
- Todo sale de lugares.json. Nunca inventes lugares ni datos de accesibilidad.
- Un campo en null significa "no lo sé": muestra "Sin dato" y no cuenta como que cumple un filtro.
- Un lugar sin lat o lng no se dibuja en el mapa.
- estado: verde (se entra y se recorre sin ayuda), amarillo (con ayuda o solo una parte), rojo (no se puede entrar en silla), null (por verificar, gris).
- Campos: id, nombre, tipo, direccion, lat, lng, estado, entrada_sin_escalones, rampa, elevador, bano_adaptado, notas, foto, verificado, fuente, fuente_coordenadas.
- Si verificado es null, el estado viene de fuentes publicadas (2020-2024) y NO se ha verificado en persona: junto al estado muestra "Según fuente, sin verificar en persona" y un enlace a la fuente.
- Muestra arriba de la app un aviso fijo: "Prototipo: datos tomados de fuentes publicadas, pendientes de verificar en campo".
- Las coordenadas son aproximadas (del lugar, no de la entrada accesible).

## Diseño
- Español, pensado primero para celular.
- Botones de al menos 44 px y buen contraste.
- El estado se dice con color y con texto, nunca solo con color.

## Fuera de alcance
Login, base de datos, reseñas de usuarios, navegación paso a paso, app nativa.
