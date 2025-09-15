// ...existing code moved from app.html inline <script>...
const fileEl = document.getElementById('file');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasFull = document.getElementById('canvasFull');
const ctxFull = canvasFull.getContext('2d');
const downloadLink = document.getElementById('download');
const actions = document.getElementById('actions');

const colPlus = document.getElementById('colPlus');
const colMinus = document.getElementById('colMinus');
const rowPlus = document.getElementById('rowPlus');
const rowMinus = document.getElementById('rowMinus');
const colsValEl = document.getElementById('colsVal');
const rowsValEl = document.getElementById('rowsVal');
const shuffleBtn = document.getElementById('shuffleBtn');
const clearBtn = document.getElementById('clearBtn');
const toggleNumbers = document.getElementById('toggleNumbers');
const downloadTilesBtn = document.getElementById('downloadTiles');

// add reference to main-wrap
const mainWrap = document.querySelector('.main-wrap');

let cols = 3, rows = 3;
let currentImg = null, lastTiles = null;
let showNumbers = true;

// store preview layout so we can hit-test tiles in the displayed preview
let previewLayout = {
  scale: 1,
  colWidths: [],    // preview widths (px)
  rowHeights: [],   // preview heights (px)
  colX: [],         // preview x offsets
  rowY: []          // preview y offsets
};

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function updateButtons() {
  colPlus.disabled = cols >= 20;
  colMinus.disabled = cols <= 1;
  rowMinus.disabled = rows <= 1;
  rowPlus.disabled = rows >= 20;
}

// new: disable numbering if cols or rows are greater than 10
function updateNumberToggle() {
  const disabled = (cols > 10) || (rows > 10);
  if (toggleNumbers) {
    toggleNumbers.disabled = disabled;
    // update visible title for clarity
    const parent = toggleNumbers.parentElement;
    if (parent) parent.title = disabled ? 'Numbering disabled when columns or rows exceed 10' : 'Show tile numbers';
    if (disabled) {
      // turn off numbers immediately
      toggleNumbers.checked = false;
      showNumbers = false;
    }
  }
}

function setCols(n) {
  cols = Math.max(1, Math.min(20, n));
  colsValEl.textContent = cols;
  updateButtons();
  updateNumberToggle();
}

function setRows(n) {
  rows = Math.max(1, Math.min(20, n));
  rowsValEl.textContent = rows;
  updateButtons();
  updateNumberToggle();
}

function drawFromTiles(tiles, colWidths, rowHeights, ctxTarget = ctx, canvasTarget = canvas, showNumbersOpt = showNumbers) {
  ctxTarget.clearRect(0, 0, canvasTarget.width, canvasTarget.height);
  let colX = [0], rowY = [0];
  for (let c = 1; c < colWidths.length; c++) colX[c] = colX[c - 1] + colWidths[c - 1];
  for (let r = 1; r < rowHeights.length; r++) rowY[r] = rowY[r - 1] + rowHeights[r - 1];
  let idx = 0;
  for (let r = 0; r < rowHeights.length; r++) {
    for (let c = 0; c < colWidths.length; c++) {
      const tile = tiles[idx], dx = colX[c], dy = rowY[r];
      ctxTarget.drawImage(tile.canvas, dx, dy);
      if (showNumbersOpt) {
        const padX = Math.max(6, Math.round(Math.min(colWidths[c], rowHeights[r]) * 0.045));
        const rectW = Math.min(72, Math.round(Math.min(colWidths[c], rowHeights[r]) * 0.18));
        const rectH = Math.min(40, Math.round(Math.min(colWidths[c], rowHeights[r]) * 0.12));
        ctxTarget.fillStyle = "rgba(0,0,0,0.55)";
        ctxTarget.fillRect(dx + padX, dy + padX, rectW, rectH);
        ctxTarget.fillStyle = "white";
        ctxTarget.font = `bold ${Math.max(12, Math.round(rectH * 0.6))}px sans-serif`;
        ctxTarget.textBaseline = "middle"; ctxTarget.textAlign = "left";
        ctxTarget.fillText(String(tile.originalIndex), dx + padX + Math.round(rectW * 0.12), dy + padX + rectH / 2);
      }
      idx++;
    }
  }
}

function drawPreview(tiles, colWidths, rowHeights) {
  // Calculate scale so preview is max 400px
  const srcW = colWidths.reduce((a, b) => a + b, 0);
  const srcH = rowHeights.reduce((a, b) => a + b, 0);
  let scale = 1;
  if (srcW > 400) scale = 400 / srcW;
  canvas.width = Math.round(srcW * scale);
  canvas.height = Math.round(srcH * scale);

  // Resize tiles ke preview
  const previewColWidths = colWidths.map(w => Math.round(w * scale));
  const previewRowHeights = rowHeights.map(h => Math.round(h * scale));
  let colX = [0], rowY = [0];
  for (let c = 1; c < previewColWidths.length; c++) colX[c] = colX[c - 1] + previewColWidths[c - 1];
  for (let r = 1; r < previewRowHeights.length; r++) rowY[r] = rowY[r - 1] + previewRowHeights[r - 1];

  // save preview layout for hit testing
  previewLayout = {
    scale,
    colWidths: previewColWidths,
    rowHeights: previewRowHeights,
    colX,
    rowY
  };

  let idx = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let r = 0; r < previewRowHeights.length; r++) {
    for (let c = 0; c < previewColWidths.length; c++) {
      const tile = tiles[idx], dx = colX[c], dy = rowY[r];
      ctx.drawImage(tile.canvas, 0, 0, tile.canvas.width, tile.canvas.height, dx, dy, previewColWidths[c], previewRowHeights[r]);
      if (showNumbers) {
        const padX = Math.max(6, Math.round(Math.min(previewColWidths[c], previewRowHeights[r]) * 0.045));
        const rectW = Math.min(72, Math.round(Math.min(previewColWidths[c], previewRowHeights[r]) * 0.18));
        const rectH = Math.min(40, Math.round(Math.min(previewColWidths[c], previewRowHeights[r]) * 0.12));
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(dx + padX, dy + padX, rectW, rectH);
        ctx.fillStyle = "white";
        ctx.font = `bold ${Math.max(12, Math.round(rectH * 0.6))}px sans-serif`;
        ctx.textBaseline = "middle"; ctx.textAlign = "left";
        ctx.fillText(String(tile.originalIndex), dx + padX + Math.round(rectW * 0.12), dy + padX + rectH / 2);
      }
      idx++;
    }
  }
}

// Drag-and-swap implementation on preview canvas
// State for current drag
let dragState = null; // {startIndex, ghostEl, offsetX, offsetY}

function getTileIndexAtPreviewPos(px, py) {
  // px,py are coordinates relative to canvas top-left
  const { colX, rowY, colWidths, rowHeights } = previewLayout;
  if (!colX || !rowY) return -1;
  let col = -1, row = -1;
  for (let c = 0; c < colX.length; c++) {
    const x0 = colX[c], x1 = x0 + colWidths[c];
    if (px >= x0 && px < x1) { col = c; break; }
  }
  for (let r = 0; r < rowY.length; r++) {
    const y0 = rowY[r], y1 = y0 + rowHeights[r];
    if (py >= y0 && py < y1) { row = r; break; }
  }
  if (col === -1 || row === -1) return -1;
  return row * previewLayout.colWidths.length + col;
}

function createGhostCanvas(tileIndex) {
  const tile = lastTiles.tiles[tileIndex];
  if (!tile) return null;

  // compute display size in preview (use preview scale)
  const s = previewLayout.scale || 1;
  const displayW = Math.max(8, Math.round(tile.canvas.width * s));
  const displayH = Math.max(8, Math.round(tile.canvas.height * s));

  // create ghost canvas at the display size (so element is not huge)
  const ghost = document.createElement('canvas');
  ghost.width = displayW;
  ghost.height = displayH;

  // also set CSS size to match (helps on high-DPR screens)
  ghost.style.width = displayW + 'px';
  ghost.style.height = displayH + 'px';

  const gctx = ghost.getContext('2d');
  // draw the tile scaled down to the preview/display size
  gctx.drawImage(tile.canvas, 0, 0, tile.canvas.width, tile.canvas.height, 0, 0, displayW, displayH);

  ghost.className = 'drag-ghost';
  document.body.appendChild(ghost);
  return ghost;
}

canvas.addEventListener('pointerdown', function (ev) {
  if (!lastTiles || !lastTiles.tiles) return;
  if (canvasWrap.classList.contains('loading')) return;
  // only left button
  if (ev.button && ev.button !== 0) return;
  const rect = canvas.getBoundingClientRect();

  // map client coords to canvas internal coordinates to handle CSS scaling
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (ev.clientX - rect.left) * scaleX;
  const py = (ev.clientY - rect.top) * scaleY;

  const idx = getTileIndexAtPreviewPos(px, py);
  if (idx < 0 || idx >= lastTiles.tiles.length) return;
  // start dragging
  canvas.setPointerCapture(ev.pointerId);
  const ghost = createGhostCanvas(idx);
  if (!ghost) return;
  dragState = {
    startIndex: idx,
    pointerId: ev.pointerId,
    ghost,
    offsetX: ev.clientX,
    offsetY: ev.clientY
  };
  // position ghost at pointer
  ghost.style.left = `${ev.clientX}px`;
  ghost.style.top = `${ev.clientY}px`;
  canvasWrap.classList.add('dragging');
});

canvas.addEventListener('pointermove', function (ev) {
  if (!dragState || dragState.pointerId !== ev.pointerId) return;
  ev.preventDefault();
  const ghost = dragState.ghost;
  if (!ghost) return;
  ghost.style.left = `${ev.clientX}px`;
  ghost.style.top = `${ev.clientY}px`;
});

async function finishDrag(ev) {
  if (!dragState) return;
  const ghost = dragState.ghost;
  // determine drop index

  const rect = canvas.getBoundingClientRect();

  // map client coords to canvas internal coordinates to handle CSS scaling
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const px = (ev.clientX - rect.left) * scaleX;
  const py = (ev.clientY - rect.top) * scaleY;

  const targetIdx = getTileIndexAtPreviewPos(px, py);
  const srcIdx = dragState.startIndex;
  // remove ghost
  if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  canvasWrap.classList.remove('dragging');
  // swap if valid and different
  if (targetIdx >= 0 && targetIdx < lastTiles.tiles.length && srcIdx !== targetIdx) {
    const arr = lastTiles.tiles;
    const tmp = arr[srcIdx];
    arr[srcIdx] = arr[targetIdx];
    arr[targetIdx] = tmp;
    // update full canvas and preview
    const srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
    const baseW = Math.floor(srcW / cols), baseH = Math.floor(srcH / rows);
    const cw = new Array(cols).fill(baseW); cw[cols - 1] = srcW - baseW * (cols - 1);
    const rh = new Array(rows).fill(baseH); rh[rows - 1] = srcH - baseH * (rows - 1);
    drawFromTiles(arr, cw, rh, ctxFull, canvasFull, showNumbers);
    drawPreview(arr, cw, rh);
    // update cache
    lastTiles.tiles = arr;
  }
  // release pointer capture
  try { canvas.releasePointerCapture(dragState.pointerId); } catch (e) {}
  dragState = null;
}

canvas.addEventListener('pointerup', function (ev) {
  finishDrag(ev);
});
canvas.addEventListener('pointercancel', function (ev) {
  finishDrag(ev);
});

function generate(useCache = false) {
  if (!currentImg) return;
  let srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
  canvasFull.width = srcW; canvasFull.height = srcH;
  let baseTileW = Math.floor(srcW / cols), baseTileH = Math.floor(srcH / rows);
  let colWidths = new Array(cols).fill(baseTileW); colWidths[cols - 1] = srcW - baseTileW * (cols - 1);
  let rowHeights = new Array(rows).fill(baseTileH); rowHeights[rows - 1] = srcH - baseTileH * (rows - 1);

  if (useCache && lastTiles && lastTiles.cols === cols && lastTiles.rows === rows) {
    shuffleArray(lastTiles.tiles);
    drawFromTiles(lastTiles.tiles, colWidths, rowHeights, ctxFull, canvasFull, showNumbers);
    drawPreview(lastTiles.tiles, colWidths, rowHeights);
    downloadLink.style.display = "inline-block";
    downloadTilesBtn.style.display = "inline-block";
    return;
  }

  let tiles = [], origIndex = 1;
  let colX = [0], rowY = [0];
  for (let c = 1; c < cols; c++) colX[c] = colX[c - 1] + colWidths[c - 1];
  for (let r = 1; r < rows; r++) rowY[r] = rowY[r - 1] + rowHeights[r - 1];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sx = colX[c], sy = rowY[r], sw = colWidths[c], sh = rowHeights[r];
      const tileCanvas = document.createElement('canvas'); tileCanvas.width = sw; tileCanvas.height = sh;
      tileCanvas.getContext('2d').drawImage(currentImg, sx, sy, sw, sh, 0, 0, sw, sh);
      tiles.push({ canvas: tileCanvas, originalIndex: origIndex, row: r+1, col: c+1 }); origIndex++;
    }
  }
  shuffleArray(tiles);
  lastTiles = { tiles: tiles.slice(), cols, rows };
  drawFromTiles(tiles, colWidths, rowHeights, ctxFull, canvasFull, showNumbers);
  drawPreview(tiles, colWidths, rowHeights);
  downloadLink.style.display = "inline-block";
  downloadTilesBtn.style.display = "inline-block";
}

downloadLink.onclick = function () {
  if (!currentImg || !lastTiles) return;
  const srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
  const baseTileW = Math.floor(srcW / cols), baseTileH = Math.floor(srcH / rows);
  const colWidths = new Array(cols).fill(baseTileW); colWidths[cols - 1] = srcW - baseTileW * (cols - 1);
  const rowHeights = new Array(rows).fill(baseTileH); rowHeights[rows - 1] = srcH - baseTileH * (rows - 1);
  drawFromTiles(lastTiles.tiles, colWidths, rowHeights, ctxFull, canvasFull, showNumbers);
  downloadLink.href = canvasFull.toDataURL("image/jpeg", 0.95);
};

downloadTilesBtn.onclick = async function() {
  if (!lastTiles || !lastTiles.tiles) return;
  const zip = new JSZip();

  // Create blobs (or fallbacks) and add as ArrayBuffer to zip
  const tasks = lastTiles.tiles.map(async tile => {
    const temp = document.createElement('canvas');
    temp.width = tile.canvas.width;
    temp.height = tile.canvas.height;
    const tctx = temp.getContext('2d');
    tctx.drawImage(tile.canvas, 0, 0);

    if (showNumbers) {
      const sw = temp.width, sh = temp.height;
      const padX = Math.max(6, Math.round(Math.min(sw, sh) * 0.045));
      const rectW = Math.min(72, Math.round(Math.min(sw, sh) * 0.18));
      const rectH = Math.min(40, Math.round(Math.min(sw, sh) * 0.12));
      tctx.fillStyle = "rgba(0,0,0,0.55)";
      tctx.fillRect(padX, padX, rectW, rectH);
      tctx.fillStyle = "white";
      tctx.font = `bold ${Math.max(12, Math.round(rectH * 0.6))}px sans-serif`;
      tctx.textBaseline = "middle"; tctx.textAlign = "left";
      tctx.fillText(String(tile.originalIndex), padX + Math.round(rectW * 0.12), padX + rectH / 2);
    }

    // Obtain blob via toBlob (async)
    const blob = await new Promise(resolve => {
      try {
        temp.toBlob(resolve, 'image/jpeg', 0.95);
      } catch (e) {
        resolve(null);
      }
    });

    if (blob) {
      // use arrayBuffer for reliability
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = `tile_row${tile.row}_col${tile.col}.jpg`;
      zip.file(fileName, arrayBuffer);
    } else {
      // fallback: use dataURL -> binary
      const dataUrl = temp.toDataURL('image/jpeg', 0.95);
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const len = binary.length;
      const uint8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) uint8[i] = binary.charCodeAt(i);
      const fileName = `tile_row${tile.row}_col${tile.col}.jpg`;
      zip.file(fileName, uint8);
    }
  });

  await Promise.all(tasks);

  const blobZip = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blobZip);
  a.download = 'tilemixer_tiles.zip';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
};

// get drop area and canvas wrapper
const canvasWrap = document.getElementById('canvasWrap');
const dropArea = document.getElementById('dropArea');

// allowed image extensions / mime types
const _allowedExt = ['jpg','jpeg','png','webp','gif'];
function isValidImageFile(file) {
  if (!file) return false;
  // mime check
  if (file.type && file.type.startsWith('image/')) return true;
  // fallback to extension check if mime is missing
  const name = (file.name || '').toLowerCase();
  const idx = name.lastIndexOf('.');
  if (idx === -1) return false;
  const ext = name.slice(idx + 1);
  return _allowedExt.includes(ext);
}

// helper to load a File object as the current image (reuses file input flow)
async function loadFileAsImage(file) {
  if (!file || !isValidImageFile(file)) {
    alert('Unsupported file. Please use a JPG or PNG image.');
    return;
  }
  const img = new Image();
  img.src = URL.createObjectURL(file);
  try {
    await img.decode();
  } catch (e) {
    // fallback: continue even if decode fails
  }
  currentImg = img;
  lastTiles = null;
  generate();
  actions.classList.remove("hidden");
  canvasWrap.classList.add('has-image');
  // mark main-wrap as having an image so sidebar won't stretch to match canvas
  mainWrap.classList.add('image-loaded');
  updateNumberToggle();
}

// file input already exists; ensure UI update when chosen via input
fileEl.addEventListener('change', async ev => {
  if (!ev.target.files.length) return;
  const file = ev.target.files[0];
  if (!isValidImageFile(file)) {
    alert('Unsupported file. Please select a JPG or PNG image.');
    fileEl.value = '';
    return;
  }
  await loadFileAsImage(file);
});

// Drag & drop handlers — only accept when no image is loaded
['dragenter', 'dragover'].forEach(evName => {
  canvasWrap.addEventListener(evName, e => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentImg) dropArea.classList.add('drop-hover');
  });
});

['dragleave', 'dragend', 'mouseout'].forEach(evName => {
  canvasWrap.addEventListener(evName, e => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('drop-hover');
  });
});

canvasWrap.addEventListener('drop', async e => {
  e.preventDefault();
  e.stopPropagation();
  dropArea.classList.remove('drop-hover');
  // only accept drop when no image currently loaded
  if (currentImg) return;
  const dt = e.dataTransfer;
  if (!dt || !dt.files || dt.files.length === 0) return;
  const file = dt.files[0];
  if (!isValidImageFile(file)) {
    alert('Unsupported file dropped. Please drop a JPG or PNG image.');
    return;
  }
  await loadFileAsImage(file);
});

// ensure canvas-wrap class is synced when clearing
clearBtn.onclick = ()=>{ 
  currentImg=null; lastTiles=null; fileEl.value=""; 
  ctx.clearRect(0,0,canvas.width,canvas.height); 
  canvas.width=0; canvas.height=0; downloadLink.style.display="none"; 
  downloadTilesBtn.style.display="none";
  actions.classList.add("hidden"); 
  ctxFull.clearRect(0,0,canvasFull.width,canvasFull.height);
  canvasFull.width=0; canvasFull.height=0;
  canvasWrap.classList.remove('has-image');
  // remove image-loaded so layout returns to equal-height state when empty
  mainWrap.classList.remove('image-loaded');
  // restore numbering to default and update toggle availability
  toggleNumbers.checked = true;
  showNumbers = true;
  updateNumberToggle();
};

toggleNumbers.addEventListener('change',()=>{ 
  showNumbers=toggleNumbers.checked; 
  if(lastTiles && currentImg){ 
    const srcW=currentImg.naturalWidth,srcH=currentImg.naturalHeight; 
    const baseW=Math.floor(srcW/cols),baseH=Math.floor(srcH/rows); 
    const cw=new Array(cols).fill(baseW); cw[cols-1]=srcW-baseW*(cols-1); 
    const rh=new Array(rows).fill(baseH); rh[rows-1]=srcH-baseH*(rows-1); 
    drawFromTiles(lastTiles.tiles,cw,rh,ctxFull,canvasFull,showNumbers); 
    drawPreview(lastTiles.tiles,cw,rh); 
  } 
});

const gridBtns = document.querySelectorAll('.grid-btn');
function updateGridMenuActive() {
  gridBtns.forEach(btn => {
    const c = +btn.getAttribute('data-cols');
    const r = +btn.getAttribute('data-rows');
    if (c === cols && r === rows) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}
gridBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const c = +this.getAttribute('data-cols');
    const r = +this.getAttribute('data-rows');
    setCols(c);
    setRows(r);
    lastTiles = null;
    generate();
    updateGridMenuActive();
  });
});
updateGridMenuActive();

setCols(cols); setRows(rows);

// loader helpers
function showLoader() {
  if (!canvasWrap) return;
  canvasWrap.classList.add('loading');
  const l = document.getElementById('ctLoader');
  if (l) l.setAttribute('aria-hidden', 'false');

  // disable stepper buttons while loading to prevent interaction
  [colPlus, colMinus, rowPlus, rowMinus].forEach(btn => {
    if (btn) btn.disabled = true;
  });
}
function hideLoader() {
  if (!canvasWrap) return;
  canvasWrap.classList.remove('loading');
  const l = document.getElementById('ctLoader');
  if (l) l.setAttribute('aria-hidden', 'true');

  // re-enable stepper buttons and restore proper state
  [colPlus, colMinus, rowPlus, rowMinus].forEach(btn => {
    if (btn) btn.disabled = false;
  });
  // ensure buttons reflect limits (1..20)
  updateButtons();
}

// Reattach column/row steppers and reshuffle button handlers with loading effect
colPlus.onclick = () => {
  showLoader();
  // small delay so loader can render before heavy synchronous work
  setTimeout(() => {
    setCols(cols + 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};
colMinus.onclick = () => {
  showLoader();
  setTimeout(() => {
    setCols(cols - 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};
rowPlus.onclick = () => {
  showLoader();
  setTimeout(() => {
    setRows(rows + 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};
rowMinus.onclick = () => {
  showLoader();
  setTimeout(() => {
    setRows(rows - 1);
    lastTiles = null;
    generate();
    hideLoader();
  }, 60);
};

// keep reshuffle immediate (no loader) or optionally add loader if desired
shuffleBtn.onclick = () => {
  if (!lastTiles) {
    showLoader();
    setTimeout(() => { generate(); hideLoader(); }, 60);
    return;
  }
  shuffleArray(lastTiles.tiles);
  const srcW = currentImg.naturalWidth, srcH = currentImg.naturalHeight;
  const baseW = Math.floor(srcW / cols), baseH = Math.floor(srcH / rows);
  const cw = new Array(cols).fill(baseW); cw[cols - 1] = srcW - baseW * (cols - 1);
  const rh = new Array(rows).fill(baseH); rh[rows - 1] = srcH - baseH * (rows - 1);
  drawFromTiles(lastTiles.tiles, cw, rh, ctxFull, canvasFull, showNumbers);
  drawPreview(lastTiles.tiles, cw, rh);
};
