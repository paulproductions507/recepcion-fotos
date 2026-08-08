import removeBackground from "@imgly/background-removal";
import JSZip from "jszip";
import "./style.css";

const TARGET_BYTES = 2.98 * 1024 * 1024;
const MAX_BYTES = 3 * 1024 * 1024;
const DB_NAME = "recibos-catalogo-pro";
const DB_VERSION = 1;
const STORE = "originales";

const state = {
  receipt: { number: "", supplier: "" },
  items: [],
  activeField: null,
  processing: false,
  currentJob: null,
  modelReady: false,
};

const app = document.querySelector("#app");

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function safeName(value) {
  return (value || "SIN_NOMBRE")
    .normalize("NFD").replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "SIN_NOMBRE";
}

function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(key, blob) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function render() {
  const done = state.items.filter(x => x.status === "done").length;
  const pending = state.items.filter(x => x.status === "pending").length;
  const errors = state.items.filter(x => x.status === "error").length;

  app.innerHTML = `
    <div class="app">
      <header class="header">
        <div class="brand">
          <h1>Recibos & Catálogo Pro</h1>
          <p>Captura → fondo → compresión HD → ZIP</p>
        </div>
        <span class="badge">${state.items.length} ítems</span>
      </header>

      <section class="card">
        <div class="grid">
          <div class="field">
            <label>Número de recibo</label>
            <div class="voice-row">
              <input id="receiptNumber" value="${escapeHtml(state.receipt.number)}" data-field="receiptNumber" placeholder="Ej. 401578" />
              <button class="btn btn-light mic" data-target="receiptNumber" title="Dictar">🎙️</button>
            </div>
          </div>
          <div class="field">
            <label>Proveedor</label>
            <div class="voice-row">
              <input id="supplier" value="${escapeHtml(state.receipt.supplier)}" data-field="supplier" placeholder="Ej. BK Enterprise" />
              <button class="btn btn-light mic" data-target="supplier" title="Dictar">🎙️</button>
            </div>
          </div>
        </div>
        <div style="height:12px"></div>
        <div class="toolbar">
          <button id="addItem" class="btn btn-dark">＋ Agregar ítem</button>
          <button id="processAll" class="btn btn-light" ${state.processing || !state.items.some(x=>x.status==="pending") ? "disabled":""}>⚙ Procesar pendientes</button>
          <button id="generateZip" class="btn btn-green" ${state.items.length===0 || state.processing || !state.items.every(x=>x.status==="done") ? "disabled":""}>⬇ Generar ZIP</button>
          <button id="clearAll" class="btn btn-light" ${state.items.length===0 ? "disabled":""}>Limpiar recibo</button>
        </div>
        <div style="height:10px"></div>
        <div class="summary">
          <span>✅ Listos: ${done}</span>
          <span>⏳ Pendientes: ${pending}</span>
          <span>⚠ Errores: ${errors}</span>
          ${state.processing ? `<span>🔄 Procesando ítem ${state.currentJob?.index ?? ""}</span>` : ""}
        </div>
        ${!window.crossOriginIsolated ? `
          <div style="height:10px"></div>
          <div class="notice">
            El sitio todavía no está aislado de origen cruzado. La IA puede no arrancar correctamente.
            Publica usando la configuración incluida en <b>vercel.json</b> o <b>public/_headers</b>.
          </div>` : ""}
      </section>

      <section id="items">
        ${state.items.length ? state.items.map(renderItem).join("") : `<div class="empty">Todavía no hay ítems. Presiona <b>Agregar ítem</b> para comenzar.</div>`}
      </section>

      <div class="modal" id="busyModal">
        <div class="modal-card">
          <h3 style="margin-top:0">Procesamiento en curso</h3>
          <p id="modalText">Preparando…</p>
          <div class="progress"><div id="modalProgress"></div></div>
          <p style="color:#6b7280;font-size:13px">Puedes seguir agregando ítems. La cola procesa uno por uno para evitar saturar la memoria del teléfono.</p>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function renderItem(item, index) {
  const originalUrl = item.originalBlob ? URL.createObjectURL(item.originalBlob) : "";
  const finalUrl = item.finalBlob ? URL.createObjectURL(item.finalBlob) : "";
  return `
    <article class="card" data-id="${item.id}">
      <div class="item-head">
        <div>
          <div class="item-title">Ítem ${index + 1}</div>
          <div class="item-number">${item.status === "done" ? "Procesado" : item.status === "processing" ? "Procesando" : item.status === "error" ? "Error" : "Pendiente"}</div>
        </div>
        <button class="btn btn-light delete-item" data-id="${item.id}">Eliminar</button>
      </div>

      <div class="grid">
        <div class="field">
          <label>Descripción</label>
          <div class="voice-row">
            <input value="${escapeHtml(item.description)}" data-id="${item.id}" data-key="description" placeholder="Ej. Zapato para dama" />
            <button class="btn btn-light mic" data-target="item:${item.id}:description">🎙️</button>
          </div>
        </div>
        <div class="field">
          <label>Referencia del proveedor</label>
          <div class="voice-row">
            <input value="${escapeHtml(item.reference)}" data-id="${item.id}" data-key="reference" placeholder="Ej. BK-4587" />
            <button class="btn btn-light mic" data-target="item:${item.id}:reference">🎙️</button>
          </div>
        </div>
        <div class="field">
          <label>Código del sistema</label>
          <div class="voice-row">
            <input value="${escapeHtml(item.systemCode)}" data-id="${item.id}" data-key="systemCode" placeholder="Ej. ZP001245" />
            <button class="btn btn-light mic" data-target="item:${item.id}:systemCode">🎙️</button>
          </div>
        </div>
        <div class="field">
          <label>Fondo final</label>
          <div class="background-row">
            <label class="bg-choice"><input type="radio" name="bg-${item.id}" value="white" ${item.background==="white"?"checked":""} data-bg="${item.id}" /> ⚪ Blanco</label>
            <label class="bg-choice"><input type="radio" name="bg-${item.id}" value="black" ${item.background==="black"?"checked":""} data-bg="${item.id}" /> ⚫ Negro</label>
          </div>
        </div>
      </div>

      <div class="photo-grid">
        <div class="photo-box">
          <b>Original</b>
          ${originalUrl ? `<img src="${originalUrl}" alt="Original" />` : `<small>No hay foto.</small>`}
          <input type="file" accept="image/*" capture="environment" data-camera="${item.id}" />
          ${item.originalBlob ? `<small>${formatMB(item.originalBlob.size)} — se conserva localmente.</small>` : ""}
        </div>
        <div class="photo-box">
          <b>Final</b>
          ${finalUrl ? `<img src="${finalUrl}" alt="Final" />` : `<small>La imagen final aparecerá aquí.</small>`}
          <div class="status ${item.status==="done"?"ok":item.status==="processing"?"busy":item.status==="error"?"err":""}">
            ${item.status === "processing" ? `<span class="spinner"></span> ${escapeHtml(item.progressText || "Procesando…")}` :
              item.status === "done" ? `✅ ${formatMB(item.finalBlob.size)} — JPG listo` :
              item.status === "error" ? `⚠ ${escapeHtml(item.error || "No se pudo procesar")}` :
              "⏳ Esperando procesamiento"}
          </div>
        </div>
      </div>

      <div style="height:10px"></div>
      <div class="toolbar">
        <button class="btn btn-dark process-one" data-id="${item.id}" ${!item.originalBlob || state.processing ? "disabled":""}>✨ Procesar este ítem</button>
      </div>
    </article>
  `;
}

function updateItem(id, patch) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  Object.assign(item, patch);
}

function bindEvents() {
  document.querySelector("#receiptNumber")?.addEventListener("input", e => {
    state.receipt.number = e.target.value;
  });
  document.querySelector("#supplier")?.addEventListener("input", e => {
    state.receipt.supplier = e.target.value;
  });

  document.querySelector("#addItem")?.addEventListener("click", () => {
    state.items.push({
      id: uid(),
      description: "",
      reference: "",
      systemCode: "",
      background: "white",
      originalBlob: null,
      originalKey: null,
      finalBlob: null,
      finalName: "",
      status: "pending",
      progressText: "",
      error: ""
    });
    render();
    document.querySelector(`[data-id="${state.items.at(-1).id}"] input`)?.focus();
  });

  document.querySelector("#processAll")?.addEventListener("click", processPending);
  document.querySelector("#generateZip")?.addEventListener("click", generateZip);
  document.querySelector("#clearAll")?.addEventListener("click", clearReceipt);

  document.querySelectorAll("input[data-key]").forEach(input => {
    input.addEventListener("focus", () => state.activeField = input);
    input.addEventListener("input", e => {
      updateItem(e.target.dataset.id, {[e.target.dataset.key]: e.target.value});
    });
  });

  document.querySelectorAll("input[data-bg]").forEach(input => {
    input.addEventListener("change", e => {
      updateItem(e.target.dataset.bg, { background: e.target.value });
    });
  });

  document.querySelectorAll(".delete-item").forEach(btn => {
    btn.addEventListener("click", async () => {
      const item = state.items.find(x => x.id === btn.dataset.id);
      if (item?.originalKey) await dbDelete(item.originalKey).catch(()=>{});
      state.items = state.items.filter(x => x.id !== btn.dataset.id);
      render();
    });
  });

  document.querySelectorAll(".process-one").forEach(btn => {
    btn.addEventListener("click", async () => {
      await processItemById(btn.dataset.id);
    });
  });

  document.querySelectorAll("input[data-camera]").forEach(input => {
    input.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      const id = e.target.dataset.camera;
      const key = `original-${id}`;
      await dbPut(key, file);
      updateItem(id, { originalBlob: file, originalKey: key, finalBlob: null, status: "pending", error: "" });
      render();
    });
  });

  document.querySelectorAll(".mic").forEach(btn => {
    btn.addEventListener("click", () => startVoice(btn.dataset.target));
  });
}

function findInput(target) {
  if (target.startsWith("item:")) {
    const [, id, key] = target.split(":");
    return document.querySelector(`input[data-id="${id}"][data-key="${key}"]`);
  }
  return document.querySelector(`#${target}`);
}

function setVoiceValue(target, text) {
  const input = findInput(target);
  if (!input) return;
  input.value = text;
  input.dispatchEvent(new Event("input", {bubbles:true}));
}

function startVoice(target) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    alert("Este navegador no ofrece reconocimiento de voz web. En Android Chrome suele funcionar mejor. Puedes escribir manualmente.");
    return;
  }
  const rec = new SR();
  rec.lang = "es-PA";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = () => {
    const input = findInput(target);
    if (input) input.placeholder = "🎙️ Escuchando…";
  };
  rec.onresult = e => {
    const text = e.results[0][0].transcript.trim();
    setVoiceValue(target, text);
  };
  rec.onerror = e => console.warn("Reconocimiento de voz:", e.error);
  rec.onend = () => render();
  rec.start();
}

async function getOriginal(item) {
  if (item.originalBlob) return item.originalBlob;
  if (item.originalKey) return dbGet(item.originalKey);
  return null;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen.")); };
    img.src = url;
  });
}

async function compositeAndCompress(maskBlob, originalBlob, background) {
  const img = await loadImage(originalBlob);
  const mask = await loadImage(maskBlob);

  const width = img.naturalWidth;
  const height = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", {alpha:false, willReadFrequently:false});

  ctx.fillStyle = background === "black" ? "#000000" : "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(mask, 0, 0, width, height);

  const blob = await canvasToJpegUnderTarget(canvas, TARGET_BYTES);
  return { blob, width, height };
}

function canvasToJpeg(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("El navegador no pudo exportar JPEG.")), "image/jpeg", quality);
  });
}

async function canvasToJpegUnderTarget(canvas, targetBytes) {
  // First try very high quality. If already below the target, do not compress further.
  let hi = 0.96;
  let lo = 0.35;
  let best = await canvasToJpeg(canvas, hi);

  if (best.size <= targetBytes) return best;

  // Binary search for the highest JPEG quality that remains below ~2.98 MB.
  for (let i = 0; i < 8; i++) {
    const mid = (hi + lo) / 2;
    const blob = await canvasToJpeg(canvas, mid);
    if (blob.size <= targetBytes) {
      best = blob;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  // Safety pass: never return > 3 MB.
  if (best.size <= MAX_BYTES) return best;

  for (let q = 0.34; q >= 0.18; q -= 0.02) {
    const blob = await canvasToJpeg(canvas, q);
    if (blob.size <= MAX_BYTES) return blob;
  }

  throw new Error("No fue posible bajar la imagen a menos de 3 MB sin una reducción adicional de resolución.");
}

async function processItem(item, queueIndex=1, queueTotal=1) {
  const original = await getOriginal(item);
  if (!original) throw new Error("Primero toma o carga la foto original.");

  if (!window.crossOriginIsolated) {
    throw new Error("El sitio no tiene Cross-Origin Isolation. Revisa vercel.json / public/_headers antes de procesar.");
  }

  item.status = "processing";
  item.progressText = `Preparando IA… (${queueIndex}/${queueTotal})`;
  item.error = "";
  render();

  const config = {
    progress: (key, current, total) => {
      const pct = total ? Math.round(current / total * 100) : 0;
      item.progressText = `IA: ${pct}%`;
      const modalText = document.querySelector("#modalText");
      if (modalText) modalText.textContent = `Ítem ${queueIndex}/${queueTotal}: ${item.description || "Sin descripción"} — ${item.progressText}`;
      const bar = document.querySelector("#modalProgress");
      if (bar) bar.style.width = `${pct}%`;
    }
  };

  // The library returns a transparent PNG. We composite it onto the chosen background,
  // then export a high-quality JPEG under the target size.
  const cutout = await removeBackground(original, config);
  item.progressText = "Aplicando fondo y compresión…";
  render();

  const result = await compositeAndCompress(cutout, original, item.background);
  const base = safeName([item.description, item.reference, item.systemCode].filter(Boolean).join("_"));
  item.finalName = `${base || `item_${queueIndex}`}.jpg`;
  item.finalBlob = result.blob;
  item.status = "done";
  item.progressText = "";
  return item;
}

async function processItemById(id) {
  if (state.processing) return;
  const item = state.items.find(x => x.id === id);
  if (!item) return;

  state.processing = true;
  state.currentJob = {index: state.items.indexOf(item)+1};
  render();

  try {
    await processItem(item, state.items.indexOf(item)+1, 1);
  } catch (err) {
    item.status = "error";
    item.error = err?.message || String(err);
  } finally {
    state.processing = false;
    state.currentJob = null;
    render();
  }
}

async function processPending() {
  if (state.processing) return;
  const pending = state.items.filter(x => x.status === "pending" || x.status === "error").filter(x => x.originalBlob || x.originalKey);
  if (!pending.length) return;

  state.processing = true;
  showModal(true);

  try {
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      state.currentJob = {index:i+1,total:pending.length};
      render();
      try {
        await processItem(item, i+1, pending.length);
      } catch (err) {
        item.status = "error";
        item.error = err?.message || String(err);
      }
    }
  } finally {
    state.processing = false;
    state.currentJob = null;
    showModal(false);
    render();
  }
}

function showModal(show) {
  const modal = document.querySelector("#busyModal");
  if (modal) modal.classList.toggle("open", show);
}

async function generateZip() {
  if (!state.items.length) return;
  if (!state.items.every(x => x.status === "done" && x.finalBlob)) {
    alert("Todavía hay ítems sin procesar.");
    return;
  }

  const zip = new JSZip();
  const folderName = `RECIBO_${safeName(state.receipt.number || "SIN_NUMERO")}_${safeName(state.receipt.supplier || "SIN_PROVEEDOR")}`;
  const folder = zip.folder(folderName);

  for (const item of state.items) {
    // No nested ZIPs. Every final image is directly inside the receipt folder.
    folder.file(item.finalName, item.finalBlob);
  }

  const blob = await zip.generateAsync({type:"blob", compression:"STORE"}, metadata => {
    const bar = document.querySelector("#modalProgress");
    if (bar) bar.style.width = `${Math.round(metadata.percent)}%`;
    const text = document.querySelector("#modalText");
    if (text) text.textContent = `Generando ZIP: ${Math.round(metadata.percent)}%`;
  });

  const fileName = `${folderName}.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function clearReceipt() {
  if (!confirm("¿Seguro que quieres borrar el recibo actual y sus originales locales?")) return;
  for (const item of state.items) {
    if (item.originalKey) await dbDelete(item.originalKey).catch(()=>{});
  }
  state.receipt = {number:"", supplier:""};
  state.items = [];
  render();
}

render();
