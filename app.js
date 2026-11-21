// Puebla sin barreras: todo sale de lugares.json.

const ESTADOS = {
  verde: { color: '#2e7d32', texto: 'Verde: se entra y se recorre sin ayuda' },
  amarillo: { color: '#f9a825', texto: 'Amarillo: con ayuda o solo una parte' },
  rojo: { color: '#c62828', texto: 'Rojo: no se puede entrar en silla' },
  sin_dato: { color: '#757575', texto: 'Gris: por verificar' },
};

const infoEstado = (estado) => ESTADOS[estado] ?? ESTADOS.sin_dato;

let lugares = [];
let mapa;
const marcadores = new Map();

const cargarLugares = async () => {
  const respuesta = await fetch('lugares.json');
  if (!respuesta.ok) throw new Error(`No se pudo cargar lugares.json (${respuesta.status})`);
  return respuesta.json();
};

const crearMapa = () => {
  mapa = L.map('mapa').setView([19.0433, -98.1983], 16);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);
};

const dibujarMarcadores = () => {
  for (const lugar of lugares) {
    if (lugar.lat == null || lugar.lng == null) continue;
    const { color, texto } = infoEstado(lugar.estado);
    const marcador = L.circleMarker([lugar.lat, lugar.lng], {
      radius: 12,
      color: '#333',
      weight: 2,
      fillColor: color,
      fillOpacity: 0.9,
    }).addTo(mapa);
    marcador.bindPopup(`<strong>${lugar.nombre}</strong><br>${texto}`);
    marcador.on('click', () => mostrarFicha(lugar));
    marcadores.set(lugar.id, marcador);
  }
};

// Ficha
const escapar = (texto) =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const formatearValor = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '<span class="sin-dato">Sin dato</span>';
  if (valor === true) return 'Sí';
  if (valor === false) return 'No';
  return escapar(valor);
};

const CAMPOS_FICHA = [
  ['entrada_sin_escalones', 'Entrada sin escalones'],
  ['rampa', 'Rampa'],
  ['elevador', 'Elevador'],
  ['bano_adaptado', 'Baño adaptado'],
  ['notas', 'Notas'],
];

const mostrarFicha = (lugar) => {
  const claveEstado = ESTADOS[lugar.estado] ? lugar.estado : 'sin_dato';
  const { texto } = infoEstado(lugar.estado);

  const avisoFuente = lugar.verificado === null
    ? `<p class="sin-verificar">Según fuente, sin verificar en persona.${
        lugar.fuente ? ` <a href="${escapar(lugar.fuente)}" target="_blank" rel="noopener">Ver fuente</a>` : ''
      }</p>`
    : '';

  const filas = CAMPOS_FICHA
    .map(([campo, etiqueta]) => `<dt>${etiqueta}</dt><dd>${formatearValor(lugar[campo])}</dd>`)
    .join('');

  const foto = lugar.foto
    ? `<img src="${escapar(lugar.foto)}" alt="Foto de ${escapar(lugar.nombre)}">`
    : '';

  document.getElementById('ficha').innerHTML = `
    <h2>${escapar(lugar.nombre)}</h2>
    <p class="tipo">${formatearValor(lugar.tipo)}</p>
    <p class="direccion">${formatearValor(lugar.direccion)}</p>
    <div class="estado-chip estado-${claveEstado}"><span class="punto punto-${claveEstado === 'sin_dato' ? 'gris' : claveEstado}"></span>${texto}</div>
    ${avisoFuente}
    <dl>${filas}</dl>
    ${foto}
    <p class="nota-coordenadas">Coordenadas aproximadas del lugar, no de la entrada accesible.</p>
  `;
  document.getElementById('ficha').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// Filtros
const filtros = { estado: 'todos', campos: new Set(), tipo: '' };

// Un null nunca cumple. Un string (como la descripción de la rampa) cuenta como que sí hay.
const cumpleCampo = (valor) => valor === true || (typeof valor === 'string' && valor.trim() !== '');

const cumpleFiltros = (lugar) => {
  if (filtros.estado !== 'todos' && lugar.estado !== filtros.estado) return false;
  if (filtros.tipo && lugar.tipo !== filtros.tipo) return false;
  for (const campo of filtros.campos) {
    if (!cumpleCampo(lugar[campo])) return false;
  }
  return true;
};

const textoEstadoCorto = (estado) => infoEstado(estado).texto.split(':')[0];

const aplicarFiltros = () => {
  const visibles = lugares.filter(cumpleFiltros);
  const idsVisibles = new Set(visibles.map((l) => l.id));

  for (const [id, marcador] of marcadores) {
    if (idsVisibles.has(id)) marcador.addTo(mapa);
    else mapa.removeLayer(marcador);
  }

  document.getElementById('contador').textContent =
    visibles.length === 1 ? '1 lugar' : `${visibles.length} lugares`;

  const lista = document.getElementById('lista-lugares');
  lista.innerHTML = visibles
    .map((lugar) => {
      const clave = ESTADOS[lugar.estado] ? lugar.estado : 'gris';
      return `<li><button type="button" data-id="${escapar(lugar.id)}">
        <span class="punto punto-${clave}"></span>
        <span>${escapar(lugar.nombre)}</span>
        <span class="estado-texto">${textoEstadoCorto(lugar.estado)}</span>
      </button></li>`;
    })
    .join('');

  const sinResultados = document.getElementById('sin-resultados');
  if (visibles.length === 0) {
    sinResultados.textContent = filtros.campos.has('bano_adaptado')
      ? 'Aún no hay datos verificados de baños adaptados.'
      : 'Ningún lugar cumple estos filtros.';
    sinResultados.hidden = false;
  } else {
    sinResultados.hidden = true;
  }
};

const irALugar = (id) => {
  const lugar = lugares.find((l) => l.id === id);
  const marcador = marcadores.get(id);
  if (!lugar) return;
  if (marcador) {
    mapa.setView(marcador.getLatLng(), 17);
    marcador.openPopup();
  }
  mostrarFicha(lugar);
};

const conectarFiltros = () => {
  document.querySelectorAll('.btn-estado').forEach((boton) => {
    boton.addEventListener('click', () => {
      document.querySelectorAll('.btn-estado').forEach((b) => b.classList.remove('activo'));
      boton.classList.add('activo');
      filtros.estado = boton.dataset.estado;
      aplicarFiltros();
    });
  });

  document.querySelectorAll('.grupo-casillas input').forEach((casilla) => {
    casilla.addEventListener('change', () => {
      if (casilla.checked) filtros.campos.add(casilla.dataset.campo);
      else filtros.campos.delete(casilla.dataset.campo);
      aplicarFiltros();
    });
  });

  const selectTipo = document.getElementById('filtro-tipo');
  const tipos = [...new Set(lugares.map((l) => l.tipo).filter(Boolean))].sort();
  for (const tipo of tipos) {
    selectTipo.insertAdjacentHTML('beforeend', `<option value="${escapar(tipo)}">${escapar(tipo)}</option>`);
  }
  selectTipo.addEventListener('change', () => {
    filtros.tipo = selectTipo.value;
    aplicarFiltros();
  });

  document.getElementById('lista-lugares').addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-id]');
    if (boton) irALugar(boton.dataset.id);
  });
};

// Asistente con la API de Anthropic.
// La llave la pega el usuario y vive solo en localStorage de su navegador.
const CLAVE_LOCAL = 'psb_llave_api';
const MODELO = 'claude-opus-5';

const leerLlave = () => localStorage.getItem(CLAVE_LOCAL) || '';

const actualizarEstadoLlave = () => {
  const estado = document.getElementById('estado-llave');
  estado.textContent = leerLlave() ? 'Llave guardada en este navegador.' : 'Sin llave. Pega una para usar el asistente.';
};

const construirSystemPrompt = () => `Eres el asistente de "Puebla sin barreras", una página que ayuda a personas en silla de ruedas a planear un recorrido por el Centro Histórico de Puebla.

Reglas:
- Usa SOLO los datos del JSON de abajo. Nunca inventes lugares ni datos de accesibilidad. Si algo no está en el JSON, di que no tienes ese dato.
- Un campo en null significa "sin dato". No lo cuentes como que cumple.
- estado: verde = se entra y se recorre sin ayuda; amarillo = con ayuda o solo una parte; rojo = no se puede entrar en silla; null = por verificar.
- Todos los datos vienen de fuentes publicadas (2020-2024) y NO se han verificado en campo. Dilo en cada respuesta, en una frase corta.
- Responde en español, en texto plano sin markdown, en máximo 6 frases o una lista corta.
- Si te piden un recorrido, ordena los lugares por cercanía usando lat y lng, y menciona el estado de cada uno.
- Al final de la respuesta, en una línea aparte, escribe "IDS:" seguido de los id de los lugares que mencionaste, separados por comas y en el orden en que los recomiendas. Si no recomendaste ninguno, escribe "IDS: ninguno".

Lugares (JSON):
${JSON.stringify(lugares)}`;

const preguntarAsistente = async (pregunta) => {
  const llave = leerLlave();
  if (!llave) throw new Error('Falta la llave de la API. Ábrela en "Llave de la API de Anthropic" y pégala.');

  let respuesta;
  try {
    respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': llave,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1024,
        output_config: { effort: 'low' },
        system: construirSystemPrompt(),
        messages: [{ role: 'user', content: pregunta }],
      }),
    });
  } catch {
    throw new Error('No hay conexión con la API. Revisa tu internet.');
  }

  if (respuesta.status === 401) throw new Error('La llave no es válida. Revísala y guárdala de nuevo.');
  if (!respuesta.ok) {
    let detalle = '';
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo?.error?.message ? `: ${cuerpo.error.message}` : '';
    } catch { /* sin detalle */ }
    throw new Error(`La API respondió con error ${respuesta.status}${detalle}`);
  }

  const datos = await respuesta.json();
  if (datos.stop_reason === 'refusal') throw new Error('El asistente no pudo responder esa pregunta.');
  const texto = datos.content
    .filter((bloque) => bloque.type === 'text')
    .map((bloque) => bloque.text)
    .join('\n')
    .trim();
  return separarIds(texto);
};

// Separa la línea "IDS: a, b" del texto y devuelve solo ids que existen en lugares.json.
const separarIds = (texto) => {
  const coincidencia = texto.match(/^\s*IDS:\s*(.*)$/im);
  if (!coincidencia) return { texto, ids: [] };
  const idsValidos = new Set(lugares.map((l) => l.id));
  const ids = coincidencia[1]
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter((id) => idsValidos.has(id));
  return { texto: texto.replace(coincidencia[0], '').trim(), ids };
};

const ESTILO_NORMAL = { radius: 12, weight: 2, color: '#333' };
const ESTILO_RESALTADO = { radius: 16, weight: 4, color: '#1565c0' };

const resaltarLugares = (ids) => {
  for (const marcador of marcadores.values()) marcador.setStyle(ESTILO_NORMAL);
  const puntos = [];
  for (const id of ids) {
    const marcador = marcadores.get(id);
    if (!marcador) continue;
    marcador.setStyle(ESTILO_RESALTADO);
    marcador.bringToFront();
    if (mapa.hasLayer(marcador)) puntos.push(marcador.getLatLng());
  }
  if (puntos.length > 0) mapa.fitBounds(L.latLngBounds(puntos), { padding: [40, 40], maxZoom: 17 });
};

const conectarAsistente = () => {
  const entradaLlave = document.getElementById('llave-api');
  const config = document.getElementById('config-llave');
  actualizarEstadoLlave();
  if (!leerLlave()) config.open = true;

  document.getElementById('guardar-llave').addEventListener('click', () => {
    const valor = entradaLlave.value.trim();
    if (!valor) return;
    localStorage.setItem(CLAVE_LOCAL, valor);
    entradaLlave.value = '';
    actualizarEstadoLlave();
    config.open = false;
  });

  document.getElementById('borrar-llave').addEventListener('click', () => {
    localStorage.removeItem(CLAVE_LOCAL);
    entradaLlave.value = '';
    actualizarEstadoLlave();
  });

  const formulario = document.getElementById('form-pregunta');
  const boton = document.getElementById('btn-preguntar');
  const salida = document.getElementById('respuesta');

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const pregunta = document.getElementById('pregunta').value.trim();
    if (!pregunta) return;

    boton.disabled = true;
    boton.textContent = 'Pensando...';
    salida.classList.remove('error');
    salida.textContent = '';

    try {
      const { texto, ids } = await preguntarAsistente(pregunta);
      salida.textContent = texto;
      resaltarLugares(ids);
      if (ids.length > 0) {
        salida.insertAdjacentHTML(
          'beforeend',
          `<p class="nota-resaltado">Lugares resaltados en el mapa: ${ids.length}. <button type="button" id="ver-mapa" class="secundario">Ver en el mapa</button></p>`
        );
        document.getElementById('ver-mapa').addEventListener('click', () => {
          document.getElementById('mapa').scrollIntoView({ behavior: 'smooth' });
        });
      }
    } catch (error) {
      salida.classList.add('error');
      salida.textContent = error.message;
      if (!leerLlave()) config.open = true;
    } finally {
      boton.disabled = false;
      boton.textContent = 'Preguntar';
    }
  });
};

const iniciar = async () => {
  try {
    crearMapa();
    lugares = await cargarLugares();
    dibujarMarcadores();
    conectarFiltros();
    aplicarFiltros();
    conectarAsistente();
  } catch (error) {
    console.error(error);
    document.getElementById('mapa').insertAdjacentHTML(
      'afterend',
      `<p role="alert">No se pudieron cargar los lugares. Abre la página desde un servidor local (python -m http.server 8000).</p>`
    );
  }
};

iniciar();
