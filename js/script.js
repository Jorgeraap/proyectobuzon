// Buzón CUC Escucha
// Guarda cada sugerencia en localStorage con fecha y hora, y permite
// descargar un ÚNICO archivo de texto con todas las sugerencias
// enumeradas y ordenadas cronológicamente.

const STORAGE_KEY = "buzonCucEscucha_sugerencias";

const form = document.getElementById("buzon-form");
const status = document.getElementById("form-status");
const lista = document.getElementById("lista-sugerencias");
const contador = document.getElementById("contador");
const btnDescargar = document.getElementById("btn-descargar");
const btnBorrar = document.getElementById("btn-borrar");

function leerSugerencias() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("No se pudo leer el almacenamiento local:", e);
    return [];
  }
}

function guardarSugerencias(lista) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function formatearFechaHora(fechaISO) {
  const d = new Date(fechaISO);
  const fecha = d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const hora = d.toLocaleTimeString("es-CO", { hour12: false });
  return `${fecha} - ${hora}`;
}

function renderLista() {
  const datos = leerSugerencias();
  contador.textContent = `(${datos.length})`;
  lista.innerHTML = "";

  if (datos.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-state";
    li.textContent = "Aún no hay sugerencias registradas.";
    lista.appendChild(li);
    return;
  }

  // Más reciente primero en pantalla
  [...datos].reverse().forEach((item, idxRev) => {
    const numero = datos.length - idxRev;
    const li = document.createElement("li");

    const top = document.createElement("div");
    top.className = "item-top";
    top.innerHTML = `
      <span>#${numero} · ${escapeHtml(item.nombre)} — ${escapeHtml(item.categoria)}</span>
      <span class="item-fecha">${formatearFechaHora(item.fechaISO)}</span>
    `;

    const msg = document.createElement("p");
    msg.className = "item-mensaje";
    msg.textContent = item.mensaje;

    li.appendChild(top);
    li.appendChild(msg);
    lista.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function mostrarStatus(mensaje, tipo) {
  status.textContent = mensaje;
  status.className = `form-status ${tipo}`;
  setTimeout(() => {
    status.textContent = "";
    status.className = "form-status";
  }, 4000);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const codigo = document.getElementById("codigo").value.trim();
  const categoria = document.getElementById("categoria").value;
  const programa = document.getElementById("programa").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();

  if (!nombre || !codigo || !categoria || !programa || !mensaje) {
    mostrarStatus("Por favor completa todos los campos.", "error");
    return;
  }

  const nuevaSugerencia = {
    nombre,
    codigo,
    categoria,
    programa,
    mensaje,
    fechaISO: new Date().toISOString(),
  };

  const datos = leerSugerencias();
  datos.push(nuevaSugerencia);
  guardarSugerencias(datos);

  renderLista();
  form.reset();
  mostrarStatus("¡Sugerencia registrada con éxito!", "ok");
});

btnDescargar.addEventListener("click", () => {
  const datos = leerSugerencias();

  if (datos.length === 0) {
    mostrarStatus("No hay sugerencias para descargar todavía.", "error");
    return;
  }

  // Orden cronológico ascendente para el archivo
  const ordenadas = [...datos].sort(
    (a, b) => new Date(a.fechaISO) - new Date(b.fechaISO)
  );

  let contenido = "BUZÓN CUC ESCUCHA - REGISTRO DE SUGERENCIAS\n";
  contenido += "Universidad de la Costa - Facultad de Ingeniería\n";
  contenido += `Archivo generado: ${formatearFechaHora(new Date().toISOString())}\n`;
  contenido += `Total de sugerencias: ${ordenadas.length}\n`;
  contenido += "=".repeat(60) + "\n\n";

  ordenadas.forEach((item, i) => {
    contenido += `SUGERENCIA #${i + 1}\n`;
    contenido += `Fecha y hora: ${formatearFechaHora(item.fechaISO)}\n`;
    contenido += `Nombre: ${item.nombre}\n`;
    contenido += `Código estudiantil: ${item.codigo}\n`;
    contenido += `Programa: ${item.programa}\n`;
    contenido += `Categoría: ${item.categoria}\n`;
    contenido += `Sugerencia: ${item.mensaje}\n`;
    contenido += "-".repeat(60) + "\n\n";
  });

  const blob = new Blob([contenido], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `buzon-cuc-escucha_${timestamp}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

btnBorrar.addEventListener("click", () => {
  if (confirm("¿Seguro que deseas borrar todos los registros guardados en este navegador?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderLista();
    mostrarStatus("Registros locales eliminados.", "ok");
  }
});

renderLista();
