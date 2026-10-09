/* Desktop-pet control panel (settings drawer > 桌宠).
 *
 * Self-contained module: it only talks to the localhost /api/pet endpoints, so
 * the main app logic in app.js is untouched. A click here writes
 * desktop-pet/settings.json; the Electron window polls that file and reacts
 * within about a second.
 */
const $ = (sel) => document.querySelector(sel);

const el = {
  note: $("#petNote"),
  visible: $("#petVisible"),
  autoShow: $("#petAutoShow"),
  onTop: $("#petOnTop"),
  follow: $("#petFollow"),
  followNote: $("#petFollowNote"),
  share: $("#petShare"),
  character: $("#petCharacter"),
  model: $("#petModel"),
  scale: $("#petScale"),
  scaleVal: $("#petScaleVal"),
  quit: $("#btnPetQuit"),
};

let settings = null; // last state known from the backend
let webChar = null; // character the live web client is using
let syncing = false; // suppress write-backs while we paint the UI
let timer = null;

async function getJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function patch(body) {
  await fetch("/api/pet/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  await refresh();
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */
function fillSelect(sel, items, current) {
  sel.innerHTML = "";
  for (const it of items) {
    const opt = document.createElement("option");
    opt.value = it.value;
    opt.textContent = it.label;
    sel.appendChild(opt);
  }
  sel.value = items.some((i) => i.value === current) ? current : items[0].value;
}

function paint(state) {
  settings = state.settings || {};
  const installed = state.installed;
  const running = state.running;

  syncing = true;
  el.visible.checked = settings.visible !== false;
  el.autoShow.checked = settings.autoShow !== false;
  el.onTop.checked = settings.alwaysOnTop !== false;
  if (el.follow) el.follow.checked = settings.followWeb !== false;
  if (el.share) el.share.checked = settings.shareHistory !== false;
  el.scale.value = String(settings.scale ?? 0.85);
  el.scaleVal.textContent = Math.round((settings.scale ?? 0.85) * 100) + "%";
  el.quit.disabled = !running;
  syncing = false;

  if (!installed) {
    el.note.textContent =
      "未检测到桌宠程序。先在项目目录执行 npm install --prefix desktop-pet，再重启服务。";
  } else if (running) {
    el.note.textContent = "桌宠正在运行，改动会立刻生效。";
  } else {
    el.note.textContent =
      settings.autoShow === false
        ? "桌宠进程未运行。打开「启动项目时自动显示」或点上方开关立即启动。"
        : "桌宠进程未运行（已退出）。打开上方开关即可重新启动。";
  }
}

/* ------------------------------------------------------------------ *
 * Lists (characters + live2d skins), refreshed only when the panel opens
 * ------------------------------------------------------------------ */
async function refreshLists() {
  const charItems = [{ value: "conf.yaml", label: "默认（跟随 conf.yaml）" }];
  try {
    const j = await getJSON("/api/characters");
    for (const c of j.characters || []) {
      if (!c.filename || c.filename === "conf.yaml") continue;
      charItems.push({
        value: c.filename,
        label: c.conf_name || c.character_name || c.slug || c.filename,
      });
    }
  } catch {
    /* backend unreachable — keep the default entry only */
  }
  const followed = settings?.followWeb !== false && webChar?.filename;
  fillSelect(el.character, charItems, followed || settings?.character || "conf.yaml");

  const modelItems = [{ value: "", label: "跟随角色" }];
  let current = settings?.model || "";
  try {
    const j = await getJSON("/api/pet/skins");
    for (const m of j.skins || []) {
      if (!m.name) continue;
      modelItems.push({ value: m.name, label: m.name });
    }
    if (!current && modelItems.length > 1) current = "";
  } catch {
    /* keep 跟随角色 only */
  }
  fillSelect(el.model, modelItems, current);
}

/* The follow switch owns the character row: while it is on, the pet mirrors the
 * character this page (or any other live client) selected, so the selector shows
 * that character and manual picks turn following off instead of fighting it. */
function paintWeb(j) {
  const following = !!(j && j.following);
  el.character.disabled = following;
  // While following, the followed character's own Live2D model is what shows;
  // a pinned skin would keep drawing the old face and look like a broken sync.
  el.model.disabled = following;
  if (following && el.model.value !== "") {
    syncing = true;
    el.model.value = "";
    syncing = false;
  }
  if (!el.followNote) return;
  el.followNote.hidden = !(following && webChar);
  if (following && webChar) {
    el.followNote.textContent =
      `正在跟随网页当前角色：${webChar.conf_name || webChar.filename}` +
      `（形象 ${webChar.live2d_model_name || "—"}，性格与记忆共用同一份角色配置）`;
    if ([...el.character.options].some((o) => o.value === webChar.filename)) {
      syncing = true;
      el.character.value = webChar.filename;
      syncing = false;
    }
  } else if (following) {
    el.followNote.hidden = false;
    el.followNote.textContent =
      "等待网页端连接：桌宠暂用下方手动选择的角色。";
  }
}

async function refresh() {
  try {
    paint(await getJSON("/api/pet"));
  } catch {
    el.note.textContent = "无法连接后端，桌宠控制不可用。";
  }
  let j = null;
  try {
    j = await getJSON("/api/pet/web-character");
    webChar = j.web || null;
  } catch {
    webChar = null;
  }
  if (el.follow) paintWeb(j);
}

/* ------------------------------------------------------------------ *
 * Wiring
 * ------------------------------------------------------------------ */
el.visible.addEventListener("change", async () => {
  if (syncing) return;
  if (el.visible.checked) {
    // May need to spawn the process, which only the launcher can do.
    await fetch("/api/pet/show", { method: "POST" });
  } else {
    await fetch("/api/pet/hide", { method: "POST" });
  }
  await refresh();
});

el.autoShow.addEventListener("change", () => {
  if (!syncing) patch({ autoShow: el.autoShow.checked });
});
el.onTop.addEventListener("change", () => {
  if (!syncing) patch({ alwaysOnTop: el.onTop.checked });
});
if (el.follow) {
  el.follow.addEventListener("change", () => {
    if (syncing) return;
    const body = { followWeb: el.follow.checked };
    // Un-checking starts from the character actually on screen right now.
    if (!el.follow.checked && webChar?.filename) body.character = webChar.filename;
    // Checking hands the avatar to the followed character; a pinned skin would
    // keep drawing the old face.
    if (el.follow.checked) body.model = "";
    patch(body).then(refreshLists);
  });
}
if (el.share) {
  el.share.addEventListener("change", () => {
    if (syncing) return;
    // Off keeps each client on its own session (records still persist); on merges
    // the web and pet into one timeline. The stored pointer is left as-is so
    // re-enabling resumes the same conversation.
    patch({ shareHistory: el.share.checked });
  });
}
el.character.addEventListener("change", () => {
  if (!syncing) patch({ character: el.character.value, followWeb: false });
});
el.model.addEventListener("change", () => {
  if (!syncing) patch({ model: el.model.value });
});
el.scale.addEventListener("input", () => {
  el.scaleVal.textContent = Math.round(Number(el.scale.value) * 100) + "%";
});
el.scale.addEventListener("change", () => {
  if (!syncing) patch({ scale: Number(el.scale.value) });
});
el.quit.addEventListener("click", async () => {
  await fetch("/api/pet/quit", { method: "POST" });
  await refresh();
});

const panel = el.note?.closest("details.setting");
if (panel) {
  panel.addEventListener("toggle", () => {
    clearInterval(timer);
    if (!panel.open) return;
    refresh().then(refreshLists);
    timer = setInterval(refresh, 2500);
  });
}

if (el.note) refresh().then(refreshLists);
