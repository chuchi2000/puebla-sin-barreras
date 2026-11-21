# Plan de build (2026-11-20)

Prototipo para demo, ~2 horas. Sin tests salvo que algo falle dos veces.
Commit después de cada bloque que funcione.

## Decisiones ya tomadas
- Página estática (index.html, style.css, app.js, lugares.json). Leaflet desde unpkg, tiles OSM.
- Llave de la API: el usuario la pega en la app, se guarda en localStorage, nunca va en el código ni en el repo.
- Asistente: primero solo texto. Resaltar en el mapa queda como último paso opcional.
- Repo: no existe. Se crea con gh si está instalado y con sesión; si no, guía manual al final.
- Datos: entrada_sin_escalones = true en los 6 (todos tienen rampa documentada), elevador = true en Museo Amparo, bano_adaptado se queda en null.

## Bloques

### 1. Mapa con semáforo
- index.html con aviso fijo arriba ("Prototipo: datos tomados de fuentes publicadas, pendientes de verificar en campo"), mapa y leyenda.
- app.js carga lugares.json con fetch, dibuja un marcador circular por lugar con lat y lng.
- Color por estado: verde, amarillo, rojo, gris (null = por verificar). La leyenda dice el color y el texto.
- Centro: Zócalo de Puebla (19.0433, -98.1983), zoom 16.
- Hecho cuando: los 6 lugares aparecen con su color y al tocar uno sale el nombre.

### 2. Ficha
- Panel abajo del mapa (celular primero) que se llena al tocar un marcador.
- Muestra: nombre, tipo, dirección, estado con color y texto, entrada sin escalones, rampa, elevador, baño adaptado, notas. Null = "Sin dato".
- Si verificado es null: "Según fuente, sin verificar en persona" + enlace a fuente.
- Foto solo si existe; aviso de coordenadas aproximadas.
- Hecho cuando: al tocar la Catedral se ven sus datos y el enlace a la fuente.

### 3. Filtros
- Botones (≥44 px) de estado: todos / verde / amarillo / rojo. Checkboxes: rampa, entrada sin escalones, elevador, baño adaptado. Select de tipo.
- Un null no cumple el filtro. Se actualizan marcadores y una lista de resultados bajo el mapa.
- Contador "N lugares" y mensaje si no hay resultados. Si el filtro de baño deja vacío: "Aún no hay datos verificados de baños adaptados".
- Hecho cuando: "verde" deja 3 lugares; "elevador" deja solo Museo Amparo; "baño" deja 0 con el mensaje.

### 4. Asistente con la API
- Campo para pegar la llave (se guarda en localStorage, botón para borrarla). Caja de texto + botón "Preguntar".
- Llamada directa a api.anthropic.com/v1/messages desde el navegador con el header de acceso directo.
- System prompt: solo puede usar lugares.json (se manda como JSON en el prompt), responde en español, corto, recuerda que los datos no están verificados en campo, nunca inventa lugares.
- Muestra la respuesta como texto; errores claros (sin llave, llave inválida, sin red).
- Hecho cuando: "¿qué museos puedo visitar sin ayuda?" responde con Museo Amparo y la advertencia.

### 5. Publicar
- git init, .gitignore, commits por bloque.
- Si gh funciona: `gh repo create` público, push a main, activar Pages (rama main, raíz).
- Si no: pasos manuales al final.
- Hecho cuando: la URL de Pages carga el mapa.

### 6. (Opcional, si sobra tiempo) Resaltar en el mapa
- Pedir a Claude que termine la respuesta con una línea `IDS: id1, id2`; la app los resalta y hace zoom.
