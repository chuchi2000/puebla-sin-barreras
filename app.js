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

const iniciar = async () => {
  try {
    crearMapa();
    lugares = await cargarLugares();
    dibujarMarcadores();
    conectarFiltros();
    aplicarFiltros();
  } catch (error) {
    console.error(error);
    document.getElementById('mapa').insertAdjacentHTML(
      'afterend',
      `<p role="alert">No se pudieron cargar los lugares. Abre la página desde un servidor local (python -m http.server 8000).</p>`
    );
  }
};

iniciar();
