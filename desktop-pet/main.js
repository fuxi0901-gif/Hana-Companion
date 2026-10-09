// Hana-Companion desktop pet — Electron main process.
// Transparent, frameless, always-on-top window that shows the Live2D pet
// served by the existing Hana-Companion backend (frontend/pet.html).
// Touches no backend code: everything goes through HTTP/WS to the server.

const {
  app,
  BrowserWindow,
  Menu,
  Tray,
  ipcMain,
  screen,
  shell,
  session,
} = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

const argvServer = process.argv.find((a) => a.startsWith("--server="));
const SERVER_URL = (
  argvServer
    ? argvServer.slice("--server=".length)
    : process.env.HANA_SERVER || "http://127.0.0.1:12393"
).replace(/\/+$/, "");
const PET_URL = `${SERVER_URL}/pet.html`;
const PET_SETTINGS_URL = `${SERVER_URL}/pet-settings.html`;
const argvSay = process.argv.find((a) => a.startsWith("--say="));
const petQuery = new URLSearchParams();
if (argvSay) petQuery.set("say", argvSay.slice("--say=".length));
if (process.argv.includes("--petdebug")) petQuery.set("debug", "1");
const PET_URL_WITH_ARGS = petQuery.toString()
  ? `${PET_URL}?${petQuery.toString()}`
  : PET_URL;

const BASE_W = 320;
const BASE_H = 420;
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const SCALE_PRESETS = [
  { label: "很小 (45%)", value: 0.45 },
  { label: "小 (65%)", value: 0.65 },
  { label: "标准 (85%)", value: 0.85 },
  { label: "大 (110%)", value: 1.1 },
  { label: "很大 (150%)", value: 1.5 },
];

const CFG_PATH = () => path.join(app.getPath("userData"), "desktop-pet.json");

function loadCfg() {
  try {
    const c = JSON.parse(fs.readFileSync(CFG_PATH(), "utf8"));
    if (c && typeof c === "object") return c;
  } catch {
    /* first run */
  }
  return { x: null, y: null };
}

function saveCfg(patch) {
  try {
    const cfg = { ...loadCfg(), ...patch };
    fs.mkdirSync(path.dirname(CFG_PATH()), { recursive: true });
    fs.writeFileSync(CFG_PATH(), JSON.stringify(cfg), "utf8");
  } catch (err) {
    console.error("[pet] saveCfg failed:", err.message);
  }
}

/* ------------------------------------------------------------------ *
 * Shared settings (desktop-pet/settings.json)
 *
 * This file is the contract between the pet window, the launcher and the
 * web UI's "桌宠" panel: the panel writes it through /api/pet/settings, the
 * pet polls it here and writes back whatever the user changed locally.
 * Only window position stays machine-local (desktop-pet.json in userData).
 * ------------------------------------------------------------------ */
const SETTINGS_PATH = path.join(__dirname, "settings.json");
const LOCK_PATH = path.join(__dirname, "pet.lock");
const SETTINGS_DEFAULTS = {
  autoShow: true,
  visible: true,
  followWeb: true,
  character: "conf.yaml",
  petUid: "",
  model: "",
  scale: 0.85,
  alwaysOnTop: true,
  clickThrough: false,
  quitRequested: false,
};

let settingsCache = null;
let settingsMtime = 0;
let appliedSettings = null;

function sanitizeSettings(s) {
  const out = { ...SETTINGS_DEFAULTS };
  for (const k of Object.keys(SETTINGS_DEFAULTS)) if (k in s) out[k] = s[k];
  out.scale = clampScale(Number(out.scale));
  out.autoShow = out.autoShow !== false;
  out.visible = out.visible !== false;
  out.followWeb = out.followWeb !== false;
  out.alwaysOnTop = out.alwaysOnTop !== false;
  out.clickThrough = out.clickThrough === true;
  if (typeof out.character !== "string" || !out.character) out.character = "conf.yaml";
  if (typeof out.model !== "string") out.model = "";
  if (typeof out.petUid !== "string") out.petUid = "";
  return out;
}

function readSettings() {
  let mtime = 0;
  let raw = null;
  try {
    mtime = fs.statSync(SETTINGS_PATH).mtimeMs;
    raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
  } catch {
    /* missing or half-written file: keep the cache */
    return settingsCache || sanitizeSettings(SETTINGS_DEFAULTS);
  }
  if (settingsCache && mtime === settingsMtime) return settingsCache;
  settingsMtime = mtime;
  settingsCache = sanitizeSettings({ ...(settingsCache || {}), ...(raw || {}) });
  return settingsCache;
}

function writeSettings(patch) {
  const next = sanitizeSettings({ ...readSettings(), ...patch });
  try {
    const tmp = SETTINGS_PATH + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(next, null, 2), "utf8");
    fs.renameSync(tmp, SETTINGS_PATH);
    settingsCache = next;
    try {
      settingsMtime = fs.statSync(SETTINGS_PATH).mtimeMs;
    } catch {
      settingsMtime = 0;
    }
  } catch (err) {
    console.error("[pet] writeSettings failed:", err.message);
  }
  return next;
}

/* Apply the diff between the last applied settings and the current ones. */
function applySettings(next) {
  if (!win || win.isDestroyed()) return;
  const prev = appliedSettings;
  appliedSettings = { ...next };
  if (!prev) return;
  if (Math.abs(next.scale - prev.scale) > 0.001) setScale(next.scale);
  if (next.alwaysOnTop !== prev.alwaysOnTop) {
    win.setAlwaysOnTop(next.alwaysOnTop, "screen-saver", 1);
  }
  if (next.clickThrough !== prev.clickThrough) applyClickThrough(next.clickThrough);
  if (next.visible !== prev.visible) {
    if (next.visible) showPetWindow();
    else win.hide();
  }
  if (next.character !== prev.character) {
    // While following the web page the renderer owns the character and mirrors
    // it back into settings.character — pushing it here would reload the model
    // a second time for the character it just switched to.
    if (!next.followWeb) {
      win.webContents.send("pet:switch-config", next.character);
    }
  }
  if (next.model !== prev.model) {
    if (!next.followWeb) win.webContents.send("pet:switch-model", next.model);
  } else if (next.followWeb && !prev.followWeb) {
    // A pinned skin would keep showing the previous character even after the
    // persona switched, which reads as "the pet did not follow"; handing the
    // avatar back to the followed character fixes the visual half.
    win.webContents.send("pet:switch-model", "");
  }
}

function showPetWindow() {
  if (!win || win.isDestroyed()) return;
  win.show();
  win.setAlwaysOnTop(true, "screen-saver", 1);
}

/* Heartbeat: the launcher reads this file to notice an instance it did not
 * spawn itself (previous run / manual npm start) instead of reporting a live
 * pet as stopped because Electron's single-instance lock killed our child. */
function touchLock() {
  try {
    fs.writeFileSync(LOCK_PATH, String(process.pid));
  } catch {
    /* read-only checkout: the pid handle still works for our own instance */
  }
}

function pollSettings() {
  const s = readSettings();
  touchLock();
  if (s.quitRequested) {
    try {
      fs.unlinkSync(LOCK_PATH); // let the launcher know we are gone right away
    } catch {
      /* ignore */
    }
    app.exit(0);
    return;
  }
  applySettings(s);
}

let win = null;
let tray = null;
let lastSenderPoint = { x: 0, y: 0 };
let dragState = null;
let scaleNow = readSettings().scale;
let charactersCache = []; // {filename, name}
let skinsCache = []; // live2d model names
let menuVisible = false;
let settingsWin = null; // 桌宠设置窗口（单实例）

function clampScale(s) {
  if (!Number.isFinite(s)) return 0.85;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

function winSize() {
  return {
    width: Math.round(BASE_W * scaleNow),
    height: Math.round(BASE_H * scaleNow),
  };
}

function defaultPosition() {
  const wa = screen.getPrimaryDisplay().workArea;
  const { width, height } = winSize();
  return { x: wa.x + wa.width - width - 48, y: wa.y + wa.height - height - 16 };
}

function validPosition(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const { width, height } = winSize();
  return screen
    .getAllDisplays()
    .some((d) => {
      const b = d.workArea;
      return x >= b.x && y >= b.y && x + width <= b.x + b.width && y + height <= b.y + b.height;
    });
}

// Keep the whole window inside the nearest display (DPI change / monitor unplug).
function clampToScreen() {
  if (!win) return;
  const [x, y] = win.getPosition();
  const { width, height } = winSize();
  const d = screen.getDisplayNearestPoint({ x, y });
  const b = d.workArea;
  const nx = Math.min(Math.max(x, b.x), b.x + b.width - width);
  const ny = Math.min(Math.max(y, b.y), b.y + b.height - height);
  if (nx !== x || ny !== y) win.setPosition(nx, ny);
}

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/`, { timeout: 2000 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

function createWindow() {
  const s = readSettings();
  const cfg = loadCfg(); // machine-local: window position only
  const { width, height } = winSize();
  let x = cfg.x;
  let y = cfg.y;
  if (!validPosition(x, y) || x === null) {
    ({ x, y } = defaultPosition());
  }

  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    transparent: true,
    frame: false,
    resizable: false,
    movable: true,
    focusable: true,
    alwaysOnTop: s.alwaysOnTop,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      partition: "persist:hana-pet",
    },
  });

  appliedSettings = { ...s };
  win.setAlwaysOnTop(s.alwaysOnTop, "screen-saver", 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (s.alwaysOnTop) win.showInactive(); // promote z-order without stealing focus
  win.once("ready-to-show", () => {
    clampToScreen();
    win.setAlwaysOnTop(true, "screen-saver", 1);
    if (s.visible && !process.argv.includes("--hidden")) win.show();
    // Some foreground apps (other Electron/Chromium windows) steal topmost
    // z-order; re-assert it periodically while the pin option is on.
    setInterval(() => {
      if (win && !win.isDestroyed() && win.isVisible() && readSettings().alwaysOnTop) {
        win.setAlwaysOnTop(true, "screen-saver", 1);
      }
    }, 2000);
  });
  screen.on("display-metrics-changed", () => clampToScreen());

  loadPetPage();
  touchLock();
  setInterval(pollSettings, 1200);

  win.on("moved", () => {
    if (!win) return;
    const [px, py] = win.getPosition();
    saveCfg({ x: px, y: py });
  });

  ipcMain.on("pet:drag-start", (e, screenX, screenY) => {
    if (!win || !Number.isFinite(screenX) || !Number.isFinite(screenY)) return;
    lastSenderPoint = { x: screenX, y: screenY };
    const [wx, wy] = win.getPosition();
    dragState = { wx, wy, sx: screenX, sy: screenY };
  });

  let dragRaf = false;
  ipcMain.on("pet:drag-move", (e, screenX, screenY) => {
    if (!win || !dragState) return;
    if (!Number.isFinite(screenX) || !Number.isFinite(screenY)) return;
    lastSenderPoint = { x: screenX, y: screenY };
    if (dragRaf) return;
    dragRaf = true;
    setImmediate(() => {
      dragRaf = false;
      if (!win || !dragState) return;
      const nx = dragState.wx + (screenX - dragState.sx);
      const ny = dragState.wy + (screenY - dragState.sy);
      win.setPosition(Math.round(nx), Math.round(ny), false);
    });
  });

  ipcMain.on("pet:drag-end", () => {
    dragState = null;
  });

  ipcMain.on("pet:ready", () => {
    const s = readSettings();
    appliedSettings = { ...s };
    applyClickThrough(s.clickThrough);
    // Hand the renderer the current selections; it queues them until the
    // WebSocket is open, so a restart lands on the same pet as before.
    // The base config is what the server already loaded, so skip the switch.
    if (s.character && s.character !== "conf.yaml") {
      win.webContents.send("pet:switch-config", s.character);
    }
    win.webContents.send("pet:switch-model", s.followWeb ? "" : s.model);
  });

  ipcMain.on("pet:context-menu", async (e) => {
    if (menuVisible) return;
    if (Number.isFinite(e.senderPoint?.x)) {
      lastSenderPoint = { x: e.senderPoint.x, y: e.senderPoint.y };
    }
    await showContextMenu();
  });
}

async function loadPetPage() {
  const ok = await checkServer();
  if (!ok) {
    setTimeout(loadPetPage, 4000);
    return;
  }
  if (!win || win.isDestroyed()) return;
  try {
    await win.loadURL(PET_URL_WITH_ARGS);
  } catch (err) {
    // ERR_ABORTED happens if a navigation supersedes ours; safe to retry.
    console.error("[pet] load failed:", err.message);
    setTimeout(loadPetPage, 4000);
  }
}

/* 设置窗口：页面由后端静态目录提供（frontend/pet-settings.html），走同一套
 * /api/pet 接口写 settings.json，所以这里不需要新的 IPC — 主进程已有的
 * 1.2s 轮询会把改动应用到桌宠窗口。打开时贴在桌宠旁边，避免被置顶的小人挡住。 */
async function openSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    if (!settingsWin.isVisible()) settingsWin.show();
    settingsWin.focus();
    return;
  }
  if (!(await checkServer())) return; // 后端没起来时页面也无法加载

  const W = 380;
  const H = 600;
  let x = null;
  let y = null;
  if (win && !win.isDestroyed()) {
    const b = win.getBounds();
    const area = screen.getPrimaryDisplay().workArea;
    x = b.x + b.width + 12 <= area.x + area.width - W ? b.x + b.width + 12 : b.x - W - 12;
    x = Math.max(area.x, Math.min(x, area.x + area.width - W));
    y = Math.max(area.y, Math.min(b.y, area.y + area.height - H));
  }

  settingsWin = new BrowserWindow({
    width: W,
    height: H,
    x,
    y,
    title: "桌宠设置",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, spellcheck: false },
  });
  settingsWin.setMenu(null);
  settingsWin.on("closed", () => {
    settingsWin = null;
  });
  try {
    await settingsWin.loadURL(PET_SETTINGS_URL);
  } catch (err) {
    console.error("[pet] settings page failed to load:", err.message);
  }
}

function applyClickThrough(enabled) {
  if (!win || win.isDestroyed()) return;
  if (enabled) {
    // Fully transparent window: ignore all mouse events. Re-enable via tray.
    win.setIgnoreMouseEvents(true, { forward: false });
  } else {
    win.setIgnoreMouseEvents(false);
  }
  writeSettings({ clickThrough: enabled });
}

function getJson(pathname, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}${pathname}`, { timeout: timeoutMs }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(null);
        }
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}

async function fetchCharacters() {
  const j = await getJson("/api/characters");
  if (!j) return [];
  return (j.characters || []).map((c) => ({
    filename: c.filename,
    name: c.character_name || c.conf_name || c.slug || c.filename,
  }));
}

async function fetchSkins() {
  const j = await getJson("/api/pet/skins");
  if (!j || !Array.isArray(j.skins)) return [];
  return j.skins.map((m) => m.name).filter(Boolean);
}

async function showContextMenu() {
  if (!win || win.isDestroyed()) return;
  menuVisible = true;
  const cfg = readSettings();
  const [chars, skins] = await Promise.all([fetchCharacters(), fetchSkins()]);
  charactersCache = chars;
  skinsCache = skins;

  const charItems = chars.map((c) => ({
    label: c.name,
    type: "radio",
    checked: !cfg.followWeb && c.filename === cfg.character,
    click: () => {
      // Picking a character by hand ends the "follow the web page" mode.
      writeSettings({ character: c.filename, followWeb: false });
      win.webContents.send("pet:switch-config", c.filename);
    },
  }));

  const skinItems = [
    {
      label: "跟随角色",
      type: "radio",
      checked: cfg.followWeb || !cfg.model,
      click: () => {
        writeSettings({ model: "" });
        win.webContents.send("pet:switch-model", "");
      },
    },
    ...skins.map((name) => ({
      label: name,
      type: "radio",
      checked: !cfg.followWeb && name === cfg.model,
      click: () => {
        // Pinning a skin is a deliberate, pet-local choice: stop following.
        writeSettings({ model: name, followWeb: false });
        win.webContents.send("pet:switch-model", name);
      },
    })),
  ];

  const template = [
    { label: "设置…", click: () => openSettingsWindow() },
    { type: "separator" },
    {
      label: "始终置顶",
      type: "checkbox",
      checked: cfg.alwaysOnTop,
      click: (item) => {
        win.setAlwaysOnTop(item.checked, "screen-saver", 1);
        writeSettings({ alwaysOnTop: item.checked });
      },
    },
    {
      label: "点击穿透（从托盘恢复）",
      type: "checkbox",
      checked: cfg.clickThrough,
      click: (item) => applyClickThrough(item.checked),
    },
    { type: "separator" },
    {
      label: "大小",
      submenu: SCALE_PRESETS.map((p) => ({
        label: p.label,
        type: "radio",
        checked: Math.abs(p.value - scaleNow) < 0.001,
        click: () => setScale(p.value),
      })),
    },
    {
      label: "形象（Live2D 模型）",
      submenu: skins.length ? skinItems : [{ label: "（无法连接后端）", enabled: false }],
    },
    {
      label: "跟随网页当前角色",
      type: "checkbox",
      checked: cfg.followWeb,
      click: (item) => writeSettings({ followWeb: item.checked }),
    },
    {
      label: "角色",
      submenu: charItems.length
        ? charItems
        : [{ label: "（无法连接后端）", enabled: false }],
    },
    { type: "separator" },
    {
      label: "启动时自动显示桌宠",
      type: "checkbox",
      checked: cfg.autoShow,
      click: (item) => writeSettings({ autoShow: item.checked }),
    },
    {
      label: "打开网页版",
      click: () => shell.openExternal(SERVER_URL + "/"),
    },
    {
      label: "重启桌宠",
      click: () => {
        loadPetPage();
      },
    },
    { role: "quit", label: "退出" },
  ];

  const menu = Menu.buildFromTemplate(template);
  const onClosed = () => {
    menuVisible = false;
    // If click-through is on, keep the window mouse-transparent.
    if (readSettings().clickThrough) applyClickThrough(true);
  };
  menu.once("menu-will-show", () => {
    if (readSettings().clickThrough) win.setIgnoreMouseEvents(false);
  });
  menu.once("menu-will-close", onClosed);
  menu.popup({ window: win, x: lastSenderPoint.x, y: lastSenderPoint.y });
}

function setScale(value) {
  scaleNow = clampScale(value);
  if (!win || win.isDestroyed()) return;
  const [ox, oy] = win.getPosition();
  const prevW = win.getContentBounds().width;
  const prevH = win.getContentBounds().height;
  const { width, height } = winSize();
  // keep bottom-center anchor so the pet "feet" stay on the desk
  const nx = Math.round(ox + (prevW - width) / 2);
  const ny = Math.round(oy + (prevH - height));
  // Windows clamps a frameless window marked resizable:false, so setSize is
  // silently ignored unless the flag is lifted for the call.
  win.setResizable(true);
  win.setSize(width, height, false);
  win.setResizable(false);
  win.setPosition(nx, ny, false);
  saveCfg({ x: nx, y: ny });
  writeSettings({ scale: scaleNow });
}

function createTray() {
  const icon = createTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("Hana 桌宠");
  const menu = Menu.buildFromTemplate([
    {
      label: "显示 / 隐藏桌宠",
      click: () => {
        if (!win) return;
        if (win.isVisible()) {
          writeSettings({ visible: false });
          win.hide();
        } else {
          writeSettings({ visible: true });
          showPetWindow();
        }
      },
    },
    {
      label: "退出点击穿透",
      click: () => applyClickThrough(false),
    },
    // 开启点击穿透后右键点不到桌宠，托盘就是设置入口。
    { label: "设置…", click: () => openSettingsWindow() },
    { type: "separator" },
    { label: "打开网页版", click: () => shell.openExternal(SERVER_URL + "/") },
    { role: "quit", label: "退出" },
  ]);
  tray.setContextMenu(menu);
}

function createTrayIcon() {
  // 16x16 sakura-pink blob, drawn as PNG bytes via raw bitmap.
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - 7.5,
        dy = y - 7.5;
      const inside = dx * dx + dy * dy <= 30;
      const i = (y * size + x) * 4;
      buf[i] = inside ? 0xf7 : 0;
      buf[i + 1] = inside ? 0xa1 : 0;
      buf[i + 2] = inside ? 0xb6 : 0;
      buf[i + 3] = inside ? 0xff : 0;
    }
  }
  const { nativeImage } = require("electron");
  return nativeImage.createFromBuffer(buf, { width: size, height: size });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (!win.isVisible()) win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler(
      (_wc, permission, cb) => {
        cb(["media", "audioCapture", "microphone"].includes(permission));
      }
    );
    session.defaultSession.setPermissionCheckHandler(
      (_wc, permission) =>
        ["media", "audioCapture", "microphone"].includes(permission)
    );
    createWindow();
    createTray();
    // 置顶/穿透时不容易点到桌宠，命令行也能直接打开设置：npm start -- --open-settings
    if (process.argv.includes("--open-settings")) openSettingsWindow();
  });
}

app.on("window-all-closed", () => app.quit());
app.on("will-quit", () => {
  try {
    fs.unlinkSync(LOCK_PATH);
  } catch {
    /* already gone */
  }
});
