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

const iniciar = async () => {
  try {
    crearMapa();
    lugares = await cargarLugares();
    dibujarMarcadores();
  } catch (error) {
    console.error(error);
    document.getElementById('mapa').insertAdjacentHTML(
      'afterend',
      `<p role="alert">No se pudieron cargar los lugares. Abre la página desde un servidor local (python -m http.server 8000).</p>`
    );
  }
};

iniciar();
