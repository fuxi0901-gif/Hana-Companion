/* ============================================================
   Hana-Companion · 花影舞台 — application core
   Live2D stage + WebSocket conversation client
   ============================================================ */
"use strict";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

/* ---------------- i18n ---------------- */
const I18N = {
  zh: {
    "boot": "正在点亮樱花舞台…",
    "status.online": "在线", "status.offline": "连接断开", "status.connecting": "连接中…",
    "status.thinking": "思考中…", "status.listening": "聆听中…", "status.speaking": "回答中…",
    "chat.title": "聊天室", "chat.placeholder": "说点什么…",
    "chat.hint": "按住麦克风说话，或直接输入文字", "chat.hint.live": "我在听… 松开发送",
    "welcome": "嗨，我是 {name} 🌸 想聊点什么都可以告诉我哦～",
    "tab.chars": "角色", "tab.bgs": "场景", "tab.history": "历史",
    "char.new": "新建角色", "char.edit": "编辑角色", "char.delete": "删除", "char.deleted": "角色已删除",
    "char.switched": "已切换到 {name}", "char.saved": "已保存 {name}",
    "char.name": "显示名称 *", "char.slug": "文件标识（slug，可留空）",
    "char.skin": "Live2D 形象 *", "char.voice": "语音（edge-tts）",
    "char.voice.filter": "搜索语音，如 zh-TW / Nanami…", "char.voice.inherit": "（继承基础配置）",
    "voice.female": "女声", "voice.male": "男声", "voice.other": "其他语言",
    "char.avatar": "头像", "char.avatar.pick": "选择图片", "char.persona": "人设提示词 *",
    "char.new.title": "新建角色", "char.edit.title": "编辑角色",
    "char.err.name": "请填写显示名称", "char.err.persona": "请填写人设提示词",
    "bg.upload": "上传背景", "bg.uploaded": "背景已上传", "bg.uploading": "正在上传，请稍候…", "bg.upload.progress": "正在上传 {p}%…", "bg.none": "默认樱花夜",
    "bg.delete": "删除背景", "bg.delete.confirm": "删除背景「{name}」？", "bg.deleted": "背景已删除", "bg.delete.failed": "删除背景失败",
    "bg.fit": "适配方式", "bg.fit.cover": "填满裁切", "bg.fit.contain": "完整显示",
    "bg.fit.stretch": "拉伸铺满", "bg.fit.original": "原始大小", "bg.zoom": "背景缩放",
    "history.new": "开始新对话", "history.empty": "暂无历史对话",
    "history.loaded": "已载入历史对话",
    "settings.title": "设定", "settings.character": "当前角色", "settings.voice": "语音",
    "settings.voice.mute": "静音（关闭语音回复）", "settings.voice.sub": "字幕跟随语音显示",
    "settings.display": "显示", "settings.display.petals": "樱花飘落", "settings.display.eyes": "视线跟随鼠标",
    "settings.modelSize": "人物大小",
    "settings.group": "群组对谈", "group.invite": "邀请", "group.leave": "退出群组",
    "group.none": "尚未加入群组。输入对方的 client_uid 邀请另一台设备加入，即可多人同时与角色对话。",
    "group.hint": "把你的 client_uid 发给对方，即可被邀请：",
    "settings.conn": "连接信息",
    "common.cancel": "取消", "common.save": "保存",
    "toast.ready": "已就绪，随时可以开始！", "toast.interrupted": "已打断",
    "toast.mic.denied": "无法访问麦克风，请检查浏览器权限",
    "toast.mic.busy": "正在回答中… 麦克风已自动打断语音",
    "toast.img": "图片已附加", "toast.conn.lost": "连接断开，正在重连…",
    "confirm.delete.char": "确定要删除角色「{name}」吗？（聊天历史将保留但角色不可恢复）",
    "confirm.delete.history": "确定要删除这段对话吗？",
    "adjust.title": "快捷调整", "adjust.posX": "水平位置", "adjust.posY": "垂直位置", "adjust.reset": "重置",
    "settings.llm": "AI 大脑（LLM）", "llm.reconfigure": "添加模型",
    "llm.title": "接入你的 AI「大脑」", "llm.intro": "Hana-Companion 是身体和脸，会思考的「大脑」由你提供。选一种方式接入：",
    "llm.ollama.title": "本地 Ollama（推荐 · 免费私密）", "llm.ollama.refresh": "刷新",
    "llm.ollama.pull": "下载推荐模型（约 1.9GB）", "llm.ollama.use": "使用所选模型",
    "llm.ollama.checking": "正在探测本地 Ollama…",
    "llm.ollama.off": "未检测到 Ollama。安装并启动 Ollama 后点「刷新」，或改用下方云端 API Key。",
    "llm.ollama.empty": "Ollama 已连接，但还没有模型。点「下载推荐模型」开始。",
    "llm.ollama.ready": "Ollama 已连接 · {n} 个模型可选",
    "llm.ollama.pulling": "正在下载 {model}…", "llm.ollama.pull.done": "{model} 已就绪！", "llm.ollama.pull.failed": "下载中断：{err}",
    "llm.cloud.title": "云端 API Key（需账号）", "llm.provider.custom": "自定义",
    "llm.baseUrl": "接口地址（base_url）", "llm.model": "模型名", "llm.key": "API Key（仅保存到本机 conf.yaml）",
    "llm.cloud.save": "测试并保存", "llm.saving": "正在测试…", "llm.saved": "AI 大脑已接入，立即生效 🌸",
    "llm.err.model": "请填写模型名", "llm.err.key": "请填写 API Key", "llm.err.baseurl": "请填写接口地址",
    "llm.status.configured": "当前模型：{model} · 已就绪",
    "llm.status.unconfigured": "尚未接入 AI「大脑」，她暂时无法思考。点「添加模型」接入。",
    "llm.status.error": "无法读取 LLM 配置。",
    "llm.hotapply": "保存后立即生效，无需重启。", "llm.skip": "稍后再说",
    "llm.switch": "切换模型", "llm.switching": "正在切换…", "llm.switched": "已切换到 {model}",
    "llm.profiles.title": "快速切换", "llm.profiles.empty": "还没有已保存的模型，配置后会出现在这里。", "llm.profiles.reconfigure": "添加模型",
    "llm.unconfigured": "未配置", "llm.switch.failed": "切换模型失败", "llm.profiles.active": "当前使用中",
  },
  en: {
    "boot": "Lighting up the sakura stage…",
    "status.online": "Online", "status.offline": "Disconnected", "status.connecting": "Connecting…",
    "status.thinking": "Thinking…", "status.listening": "Listening…", "status.speaking": "Speaking…",
    "chat.title": "Chat", "chat.placeholder": "Say something…",
    "chat.hint": "Hold the mic to talk, or type a message", "chat.hint.live": "I'm listening… release to send",
    "welcome": "Hi, I'm {name} 🌸 Tell me anything you like~",
    "tab.chars": "Character", "tab.bgs": "Scene", "tab.history": "History",
    "char.new": "New Character", "char.edit": "Edit", "char.delete": "Delete", "char.deleted": "Character deleted",
    "char.switched": "Switched to {name}", "char.saved": "Saved {name}",
    "char.name": "Display name *", "char.slug": "Slug (optional)",
    "char.skin": "Live2D model *", "char.voice": "Voice (edge-tts)",
    "char.voice.filter": "Search voices, e.g. zh-TW / Nanami…", "char.voice.inherit": "(Inherit base config)",
    "voice.female": "Female", "voice.male": "Male", "voice.other": "Other languages",
    "char.avatar": "Avatar", "char.avatar.pick": "Pick image", "char.persona": "Persona prompt *",
    "char.new.title": "New Character", "char.edit.title": "Edit Character",
    "char.err.name": "Display name is required", "char.err.persona": "Persona prompt is required",
    "bg.upload": "Upload background", "bg.uploaded": "Background uploaded", "bg.uploading": "Uploading, please wait…", "bg.upload.progress": "Uploading {p}%…", "bg.none": "Default sakura night",
    "bg.delete": "Delete background", "bg.delete.confirm": "Delete background \"{name}\"?", "bg.deleted": "Background deleted", "bg.delete.failed": "Could not delete the background",
    "bg.fit": "Fit mode", "bg.fit.cover": "Cover (crop)", "bg.fit.contain": "Contain (fit)",
    "bg.fit.stretch": "Stretch", "bg.fit.original": "Original size", "bg.zoom": "Background zoom",
    "history.new": "New conversation", "history.empty": "No history yet",
    "history.loaded": "History loaded",
    "settings.title": "Settings", "settings.character": "Current character", "settings.voice": "Voice",
    "settings.voice.mute": "Mute (no voice replies)", "settings.voice.sub": "Subtitle follows speech",
    "settings.display": "Display", "settings.display.petals": "Sakura petals", "settings.display.eyes": "Eyes follow cursor",
    "settings.modelSize": "Model size",
    "settings.group": "Group chat", "group.invite": "Invite", "group.leave": "Leave group",
    "group.none": "Not in a group yet. Enter another device's client_uid to invite it and chat together.",
    "group.hint": "Share your client_uid to be invited:",
    "settings.conn": "Connection",
    "common.cancel": "Cancel", "common.save": "Save",
    "toast.ready": "All set — let's begin!", "toast.interrupted": "Interrupted",
    "toast.mic.denied": "Microphone access denied — check browser permissions",
    "toast.mic.busy": "Answering… playback auto-interrupted",
    "toast.img": "Image attached", "toast.conn.lost": "Connection lost, reconnecting…",
    "confirm.delete.char": "Delete character \"{name}\"? Chat history is kept, the character is not recoverable.",
    "confirm.delete.history": "Delete this conversation?",
    "adjust.title": "Quick Adjust", "adjust.posX": "Horizontal", "adjust.posY": "Vertical", "adjust.reset": "Reset",
    "settings.llm": "AI Brain (LLM)", "llm.reconfigure": "Add model",
    "llm.title": "Connect Your AI \"Brain\"", "llm.intro": "Hana-Companion is the body and face — the thinking \"brain\" is yours to plug in. Pick one:",
    "llm.ollama.title": "Local Ollama (recommended · free & private)", "llm.ollama.refresh": "Refresh",
    "llm.ollama.pull": "Download recommended model (~1.9 GB)", "llm.ollama.use": "Use selected model",
    "llm.ollama.checking": "Probing local Ollama…",
    "llm.ollama.off": "Ollama not detected. Install and start Ollama, then hit Refresh — or use a cloud API key below.",
    "llm.ollama.empty": "Ollama is connected but has no models yet. Hit \"Download recommended model\" to start.",
    "llm.ollama.ready": "Ollama connected · {n} models available",
    "llm.ollama.pulling": "Downloading {model}…", "llm.ollama.pull.done": "{model} is ready!", "llm.ollama.pull.failed": "Download interrupted: {err}",
    "llm.cloud.title": "Cloud API Key (account required)", "llm.provider.custom": "Custom",
    "llm.baseUrl": "Endpoint (base_url)", "llm.model": "Model name", "llm.key": "API Key (saved only to local conf.yaml)",
    "llm.cloud.save": "Test & Save", "llm.saving": "Testing…", "llm.saved": "AI brain connected — live immediately 🌸",
    "llm.err.model": "Model name is required", "llm.err.key": "API key is required", "llm.err.baseurl": "Endpoint URL is required",
    "llm.status.configured": "Current model: {model} · ready",
    "llm.status.unconfigured": "No thinking \"brain\" connected yet — she can't reply. Hit Add model to plug one in.",
    "llm.status.error": "Could not read the LLM config.",
    "llm.hotapply": "Applies immediately after saving — no restart needed.", "llm.skip": "Maybe later",
    "llm.switch": "Switch model", "llm.switching": "Switching…", "llm.switched": "Switched to {model}",
    "llm.profiles.title": "Quick switch", "llm.profiles.empty": "No saved models yet — configure one and it will show up here.", "llm.profiles.reconfigure": "Add model",
    "llm.unconfigured": "Not set up", "llm.switch.failed": "Could not switch the model", "llm.profiles.active": "Currently active",
  },
  ja: {
    "boot": "桜のステージを灯しています…",
    "status.online": "オンライン", "status.offline": "切断", "status.connecting": "接続中…",
    "status.thinking": "考え中…", "status.listening": "聞いています…", "status.speaking": "話しています…",
    "chat.title": "チャット", "chat.placeholder": "何か話して…",
    "chat.hint": "マイクを長押し、または文字を入力", "chat.hint.live": "聞いてるよ… 離して送信",
    "welcome": "こんにちは、{name} です 🌸 何でも話してね〜",
    "tab.chars": "キャラ", "tab.bgs": "シーン", "tab.history": "履歴",
    "char.new": "新規キャラ", "char.edit": "編集", "char.delete": "削除", "char.deleted": "キャラを削除しました",
    "char.switched": "{name} に切り替えました", "char.saved": "{name} を保存しました",
    "char.name": "表示名 *", "char.slug": "スラッグ（任意）",
    "char.skin": "Live2D モデル *", "char.voice": "音声（edge-tts）",
    "char.voice.filter": "音声を検索（zh-TW / Nanami など）…", "char.voice.inherit": "（基本設定を継承）",
    "voice.female": "女性", "voice.male": "男性", "voice.other": "その他の言語",
    "char.avatar": "アバター", "char.avatar.pick": "画像を選択", "char.persona": "キャラ設定 *",
    "char.new.title": "新規キャラ", "char.edit.title": "キャラ編集",
    "char.err.name": "表示名を入力してください", "char.err.persona": "キャラ設定を入力してください",
    "bg.upload": "背景をアップロード", "bg.uploaded": "背景をアップロードしました", "bg.uploading": "アップロード中です…", "bg.upload.progress": "アップロード中 {p}%…", "bg.none": "デフォルト（桜夜）",
    "bg.delete": "背景を削除", "bg.delete.confirm": "背景「{name}」を削除しますか？", "bg.deleted": "背景を削除しました", "bg.delete.failed": "背景を削除できませんでした",
    "bg.fit": "表示方式", "bg.fit.cover": "切り抜き", "bg.fit.contain": "全体表示",
    "bg.fit.stretch": "引き伸ばし", "bg.fit.original": "原寸", "bg.zoom": "背景ズーム",
    "history.new": "新しい会話", "history.empty": "履歴はまだありません",
    "history.loaded": "履歴を読み込みました",
    "settings.title": "設定", "settings.character": "現在のキャラ", "settings.voice": "音声",
    "settings.voice.mute": "ミュート（音声返信なし）", "settings.voice.sub": "字幕を音声に合わせて表示",
    "settings.display": "表示", "settings.display.petals": "桜の花びら", "settings.display.eyes": "視線をマウスに追従",
    "settings.modelSize": "モデルのサイズ",
    "settings.group": "グループ会話", "group.invite": "招待", "group.leave": "グループ退出",
    "group.none": "まだグループに参加していません。相手の client_uid を入力して招待すると、一緒に会話できます。",
    "group.hint": "あなたの client_uid を相手に教えると招待されます：",
    "settings.conn": "接続情報",
    "common.cancel": "キャンセル", "common.save": "保存",
    "toast.ready": "準備完了、話そう！", "toast.interrupted": "中断しました",
    "toast.mic.denied": "マイクにアクセスできません。権限を確認してください",
    "toast.mic.busy": "回答中… 再生を自動中断しました",
    "toast.img": "画像を添付しました", "toast.conn.lost": "接続が切れました。再接続中…",
    "confirm.delete.char": "キャラ「{name}」を削除しますか？（履歴は残りますが元に戻せません）",
    "confirm.delete.history": "この会話を削除しますか？",
    "adjust.title": "クイック調整", "adjust.posX": "横位置", "adjust.posY": "縦位置", "adjust.reset": "リセット",
    "settings.llm": "AI 頭脳（LLM）", "llm.reconfigure": "モデルを追加",
    "llm.title": "AI「頭脳」をつなぐ", "llm.intro": "Hana-Companion は体と顔。考える「頭脳」はあなたが用意します。どちらか選んでください：",
    "llm.ollama.title": "ローカル Ollama（推奨 · 無料で非公開）", "llm.ollama.refresh": "更新",
    "llm.ollama.pull": "推奨モデルをダウンロード（約 1.9GB）", "llm.ollama.use": "選択したモデルを使う",
    "llm.ollama.checking": "ローカルの Ollama を確認しています…",
    "llm.ollama.off": "Ollama が見つかりません。Ollama を起動して「更新」を押すか、下のクラウド API キーを使ってください。",
    "llm.ollama.empty": "Ollama は接続済みですが、モデルがまだありません。「推奨モデルをダウンロード」で始めましょう。",
    "llm.ollama.ready": "Ollama 接続中 · モデル {n} 個",
    "llm.ollama.pulling": "{model} をダウンロード中…", "llm.ollama.pull.done": "{model} の準備ができました！", "llm.ollama.pull.failed": "ダウンロードが中断されました：{err}",
    "llm.cloud.title": "クラウド API キー（アカウント必要）", "llm.provider.custom": "カスタム",
    "llm.baseUrl": "エンドポイント（base_url）", "llm.model": "モデル名", "llm.key": "API キー（ローカルの conf.yaml のみに保存）",
    "llm.cloud.save": "テストして保存", "llm.saving": "テスト中…", "llm.saved": "AI 頭脳を接続しました。すぐに使えます 🌸",
    "llm.err.model": "モデル名を入力してください", "llm.err.key": "API キーを入力してください", "llm.err.baseurl": "エンドポイントを入力してください",
    "llm.status.configured": "現在のモデル：{model} · 準備完了",
    "llm.status.unconfigured": "まだ「頭脳」が接続されておらず、返信できません。「モデルを追加」から接続してください。",
    "llm.status.error": "LLM 設定を読み込めませんでした。",
    "llm.hotapply": "保存後は再起動不要で、すぐに反映されます。", "llm.skip": "後で",
    "llm.switch": "モデル切替", "llm.switching": "切替中…", "llm.switched": "{model} に切り替えました",
    "llm.profiles.title": "クイック切替", "llm.profiles.empty": "保存したモデルはまだありません。設定するとここに表示されます。", "llm.profiles.reconfigure": "モデルを追加",
    "llm.unconfigured": "未設定", "llm.switch.failed": "モデル切替に失敗しました", "llm.profiles.active": "使用中",
  },
  "zh-TW": {
    "boot": "正在點亮櫻花舞台…",
    "status.online": "線上", "status.offline": "連線中斷", "status.connecting": "連線中…",
    "status.thinking": "思考中…", "status.listening": "聆聽中…", "status.speaking": "回答中…",
    "chat.title": "聊天室", "chat.placeholder": "說點什麼…",
    "chat.hint": "按住麥克風說話，或直接輸入文字", "chat.hint.live": "我在聽… 放開送出",
    "welcome": "嗨，我是 {name} 🌸 想聊什麼都可以告訴我哦～",
    "tab.chars": "角色", "tab.bgs": "場景", "tab.history": "歷史",
    "char.new": "新建角色", "char.edit": "編輯角色", "char.delete": "刪除", "char.deleted": "角色已刪除",
    "char.switched": "已切換到 {name}", "char.saved": "已儲存 {name}",
    "char.name": "顯示名稱 *", "char.slug": "檔案標識（slug，可留空）",
    "char.skin": "Live2D 形象 *", "char.voice": "語音（edge-tts）",
    "char.voice.filter": "搜尋語音，如 zh-TW / HsiaoChen…", "char.voice.inherit": "（繼承基礎設定）",
    "voice.female": "女聲", "voice.male": "男聲", "voice.other": "其他語言",
    "char.avatar": "頭像", "char.avatar.pick": "選擇圖片", "char.persona": "人設提示詞 *",
    "char.new.title": "新建角色", "char.edit.title": "編輯角色",
    "char.err.name": "請填寫顯示名稱", "char.err.persona": "請填寫人設提示詞",
    "bg.upload": "上傳背景", "bg.uploaded": "背景已上傳", "bg.uploading": "正在上傳，請稍候…", "bg.upload.progress": "正在上傳 {p}%…", "bg.none": "預設櫻花夜",
    "bg.delete": "刪除背景", "bg.delete.confirm": "刪除背景「{name}」？", "bg.deleted": "背景已刪除", "bg.delete.failed": "刪除背景失敗",
    "bg.fit": "適配方式", "bg.fit.cover": "填滿裁切", "bg.fit.contain": "完整顯示",
    "bg.fit.stretch": "拉伸鋪滿", "bg.fit.original": "原始大小", "bg.zoom": "背景縮放",
    "history.new": "開始新對話", "history.empty": "暫無歷史對話",
    "history.loaded": "已載入歷史對話",
    "settings.title": "設定", "settings.character": "當前角色", "settings.voice": "語音",
    "settings.voice.mute": "靜音（關閉語音回覆）", "settings.voice.sub": "字幕跟隨語音顯示",
    "settings.display": "顯示", "settings.display.petals": "櫻花飄落", "settings.display.eyes": "視線跟隨滑鼠",
    "settings.modelSize": "人物大小",
    "settings.group": "群組對談", "group.invite": "邀請", "group.leave": "退出群組",
    "group.none": "尚未加入群組。輸入對方的 client_uid 邀請另一台裝置加入，即可多人同時與角色對話。",
    "group.hint": "把你的 client_uid 發給對方，即可被邀請：",
    "settings.conn": "連線資訊",
    "common.cancel": "取消", "common.save": "儲存",
    "toast.ready": "已就緒，隨時可以開始！", "toast.interrupted": "已打斷",
    "toast.mic.denied": "無法存取麥克風，請檢查瀏覽器權限",
    "toast.mic.busy": "正在回答中… 麥克風已自動打斷語音",
    "toast.img": "圖片已附加", "toast.conn.lost": "連線中斷，正在重連…",
    "confirm.delete.char": "確定要刪除角色「{name}」嗎？（聊天歷史將保留但角色無法復原）",
    "confirm.delete.history": "確定要刪除這段對話嗎？",
    "adjust.title": "快捷調整", "adjust.posX": "水平位置", "adjust.posY": "垂直位置", "adjust.reset": "重設",
    "settings.llm": "AI 大腦（LLM）", "llm.reconfigure": "新增模型",
    "llm.title": "接入你的 AI「大腦」", "llm.intro": "Hana-Companion 是身體和臉，會思考的「大腦」由你提供。選一種方式接入：",
    "llm.ollama.title": "本機 Ollama（推薦 · 免費私密）", "llm.ollama.refresh": "重新整理",
    "llm.ollama.pull": "下載推薦模型（約 1.9GB）", "llm.ollama.use": "使用所選模型",
    "llm.ollama.checking": "正在探測本機 Ollama…",
    "llm.ollama.off": "未偵測到 Ollama。安裝並啟動 Ollama 後點「重新整理」，或改用下方雲端 API Key。",
    "llm.ollama.empty": "Ollama 已連線，但還沒有模型。點「下載推薦模型」開始。",
    "llm.ollama.ready": "Ollama 已連線 · {n} 個模型可選",
    "llm.ollama.pulling": "正在下載 {model}…", "llm.ollama.pull.done": "{model} 已就緒！", "llm.ollama.pull.failed": "下載中斷：{err}",
    "llm.cloud.title": "雲端 API Key（需帳號）", "llm.provider.custom": "自訂",
    "llm.baseUrl": "介面地址（base_url）", "llm.model": "模型名", "llm.key": "API Key（僅儲存到本機 conf.yaml）",
    "llm.cloud.save": "測試並儲存", "llm.saving": "正在測試…", "llm.saved": "AI 大腦已接入，立即生效 🌸",
    "llm.err.model": "請填寫模型名", "llm.err.key": "請填寫 API Key", "llm.err.baseurl": "請填寫介面地址",
    "llm.status.configured": "目前模型：{model} · 已就緒",
    "llm.status.unconfigured": "尚未接入 AI「大腦」，她暫時無法思考。點「新增模型」接入。",
    "llm.status.error": "無法讀取 LLM 設定。",
    "llm.hotapply": "儲存後立即生效，無需重啟。", "llm.skip": "稍後再說",
    "llm.switch": "切換模型", "llm.switching": "正在切換…", "llm.switched": "已切換到 {model}",
    "llm.profiles.title": "快速切換", "llm.profiles.empty": "還沒有已儲存的模型，設定後會出現在這裡。", "llm.profiles.reconfigure": "新增模型",
    "llm.unconfigured": "未設定", "llm.switch.failed": "切換模型失敗", "llm.profiles.active": "目前使用中",
  },
  ko: {
    "boot": "사쿠라 무대를 밝히고 있어요…",
    "status.online": "온라인", "status.offline": "연결 끊김", "status.connecting": "연결 중…",
    "status.thinking": "생각 중…", "status.listening": "듣고 있어요…", "status.speaking": "말하고 있어요…",
    "chat.title": "채팅", "chat.placeholder": "무엇이든 말해보세요…",
    "chat.hint": "마이크를 길게 눌러 말하거나 직접 입력하세요", "chat.hint.live": "듣고 있어요… 놓으면 전송돼요",
    "welcome": "안녕, 나는 {name} 🌸 뭐든 이야기해 줘~",
    "tab.chars": "캐릭터", "tab.bgs": "배경", "tab.history": "기록",
    "char.new": "새 캐릭터", "char.edit": "편집", "char.delete": "삭제", "char.deleted": "캐릭터를 삭제했어요",
    "char.switched": "{name}(으)로 전환했어요", "char.saved": "{name}을 저장했어요",
    "char.name": "표시 이름 *", "char.slug": "슬러그 (선택)",
    "char.skin": "Live2D 모델 *", "char.voice": "음성 (edge-tts)",
    "char.voice.filter": "음성 검색 (예: ko-KR / SunHi…)", "char.voice.inherit": "(기본 설정 상속)",
    "voice.female": "여성", "voice.male": "남성", "voice.other": "기타 언어",
    "char.avatar": "아바타", "char.avatar.pick": "이미지 선택", "char.persona": "캐릭터 설정 *",
    "char.new.title": "새 캐릭터", "char.edit.title": "캐릭터 편집",
    "char.err.name": "표시 이름을 입력해 주세요", "char.err.persona": "캐릭터 설정을 입력해 주세요",
    "bg.upload": "배경 업로드", "bg.uploaded": "배경을 업로드했어요", "bg.uploading": "업로드 중이에요, 잠시만 기다려 주세요…", "bg.upload.progress": "업로드 중 {p}%…", "bg.none": "기본 (사쿠라 밤)",
    "bg.delete": "배경 삭제", "bg.delete.confirm": "배경 \"{name}\"을(를) 삭제할까요?", "bg.deleted": "배경을 삭제했어요", "bg.delete.failed": "배경 삭제 실패",
    "bg.fit": "맞춤 방식", "bg.fit.cover": "채우기 (자르기)", "bg.fit.contain": "전체 보기",
    "bg.fit.stretch": "늘리기", "bg.fit.original": "원본 크기", "bg.zoom": "배경 확대/축소",
    "history.new": "새 대화 시작", "history.empty": "기록이 아직 없어요",
    "history.loaded": "기록을 불러왔어요",
    "settings.title": "설정", "settings.character": "현재 캐릭터", "settings.voice": "음성",
    "settings.voice.mute": "음소거 (음성 답장 끄기)", "settings.voice.sub": "자막이 음성을 따라 표시돼요",
    "settings.display": "화면", "settings.display.petals": "사쿠라 꽃잎", "settings.display.eyes": "시선이 마우스를 따라가요",
    "settings.modelSize": "캐릭터 크기",
    "settings.group": "그룹 대화", "group.invite": "초대", "group.leave": "그룹 나가기",
    "group.none": "아직 그룹에 참여하지 않았어요. 상대의 client_uid를 입력해 초대하면 함께 대화할 수 있어요.",
    "group.hint": "내 client_uid를 상대에게 알려주면 초대받을 수 있어요:",
    "settings.conn": "연결 정보",
    "common.cancel": "취소", "common.save": "저장",
    "toast.ready": "준비 완료, 언제든 시작할 수 있어요!", "toast.interrupted": "중단했어요",
    "toast.mic.denied": "마이크에 접근할 수 없어요. 브라우저 권한을 확인해 주세요",
    "toast.mic.busy": "답변 중… 재생을 자동으로 중단했어요",
    "toast.img": "이미지를 첨부했어요", "toast.conn.lost": "연결이 끊겼어요. 다시 연결하는 중…",
    "confirm.delete.char": "캐릭터 \"{name}\"을 삭제할까요? (대화 기록은 유지되지만 캐릭터는 복구할 수 없어요)",
    "confirm.delete.history": "이 대화를 삭제할까요?",
    "adjust.title": "빠른 조정", "adjust.posX": "가로 위치", "adjust.posY": "세로 위치", "adjust.reset": "초기화",
    "settings.llm": "AI 두뇌 (LLM)", "llm.reconfigure": "모델 추가",
    "llm.title": "AI 「두뇌」 연결하기", "llm.intro": "Hana-Companion는 몸과 얼굴이고, 생각하는 「두뇌」는 당신이 제공해요. 방식을 선택하세요:",
    "llm.ollama.title": "로컬 Ollama (추천 · 무료·비공개)", "llm.ollama.refresh": "새로 고침",
    "llm.ollama.pull": "추천 모델 다운로드 (약 1.9GB)", "llm.ollama.use": "선택한 모델 사용",
    "llm.ollama.checking": "로컬 Ollama 확인 중…",
    "llm.ollama.off": "Ollama가 발견되지 않아요. Ollama를 실행하고 「새로 고침」을 누르거나, 아래 클라우드 API 키를 사용하세요.",
    "llm.ollama.empty": "Ollama에 연결했지만 아직 모델이 없어요. 「추천 모델 다운로드」로 시작해 보세요.",
    "llm.ollama.ready": "Ollama 연결됨 · 모델 {n}개",
    "llm.ollama.pulling": "{model} 다운로드 중…", "llm.ollama.pull.done": "{model} 준비 완료!", "llm.ollama.pull.failed": "다운로드 중단됨: {err}",
    "llm.cloud.title": "클라우드 API 키 (계정 필요)", "llm.provider.custom": "사용자 지정",
    "llm.baseUrl": "엔드포인트 (base_url)", "llm.model": "모델 이름", "llm.key": "API 키 (로컬 conf.yaml에만 저장)",
    "llm.cloud.save": "테스트 후 저장", "llm.saving": "테스트 중…", "llm.saved": "AI 두뇌가 연결되었어요. 바로 적용됩니다 🌸",
    "llm.err.model": "모델 이름을 입력해 주세요", "llm.err.key": "API 키를 입력해 주세요", "llm.err.baseurl": "엔드포인트를 입력해 주세요",
    "llm.status.configured": "현재 모델: {model} · 준비 완료",
    "llm.status.unconfigured": "아직 「두뇌」가 연결되지 않아 답변할 수 없어요. 「모델 추가」로 연결해 주세요.",
    "llm.status.error": "LLM 설정을 읽을 수 없어요.",
    "llm.hotapply": "저장하면 재시작 없이 바로 적용돼요.", "llm.skip": "나중에",
    "llm.switch": "모델 전환", "llm.switching": "전환 중…", "llm.switched": "{model}(으)로 전환했어요",
    "llm.profiles.title": "빠른 전환", "llm.profiles.empty": "저장된 모델이 아직 없어요. 설정하면 여기에 나타나요.", "llm.profiles.reconfigure": "모델 추가",
    "llm.unconfigured": "미설정", "llm.switch.failed": "모델 전환 실패", "llm.profiles.active": "사용 중",
  },
  ru: {
    "boot": "Освещаю сцену сакуры…",
    "status.online": "Онлайн", "status.offline": "Отключено", "status.connecting": "Подключение…",
    "status.thinking": "Думаю…", "status.listening": "Слушаю…", "status.speaking": "Отвечаю…",
    "chat.title": "Чат", "chat.placeholder": "Скажите что-нибудь…",
    "chat.hint": "Удерживайте микрофон или введите текст", "chat.hint.live": "Слушаю… отпустите для отправки",
    "welcome": "Привет, я {name} 🌸 Расскажи мне о чём угодно~",
    "tab.chars": "Персонаж", "tab.bgs": "Сцена", "tab.history": "История",
    "char.new": "Новый персонаж", "char.edit": "Изменить", "char.delete": "Удалить", "char.deleted": "Персонаж удалён",
    "char.switched": "Переключено на {name}", "char.saved": "{name} сохранён",
    "char.name": "Отображаемое имя *", "char.slug": "Слаг (необязательно)",
    "char.skin": "Модель Live2D *", "char.voice": "Голос (edge-tts)",
    "char.voice.filter": "Поиск голоса, напр. ru-RU / Svetlana…", "char.voice.inherit": "(наследовать базовые настройки)",
    "voice.female": "женский", "voice.male": "мужской", "voice.other": "Другие языки",
    "char.avatar": "Аватар", "char.avatar.pick": "Выбрать изображение", "char.persona": "Промпт персонажа *",
    "char.new.title": "Новый персонаж", "char.edit.title": "Изменить персонажа",
    "char.err.name": "Укажите отображаемое имя", "char.err.persona": "Укажите промпт персонажа",
    "bg.upload": "Загрузить фон", "bg.uploaded": "Фон загружен", "bg.uploading": "Загрузка, подождите…", "bg.upload.progress": "Загрузка {p}%…", "bg.none": "Ночь сакуры по умолчанию",
    "bg.delete": "Удалить фон", "bg.delete.confirm": "Удалить фон «{name}»?", "bg.deleted": "Фон удалён", "bg.delete.failed": "Не удалось удалить фон",
    "bg.fit": "Режим подгонки", "bg.fit.cover": "Заполнить (обрезка)", "bg.fit.contain": "Вписать",
    "bg.fit.stretch": "Растянуть", "bg.fit.original": "Оригинальный размер", "bg.zoom": "Масштаб фона",
    "history.new": "Новый диалог", "history.empty": "Истории пока нет",
    "history.loaded": "История загружена",
    "settings.title": "Настройки", "settings.character": "Текущий персонаж", "settings.voice": "Голос",
    "settings.voice.mute": "Без звука (без голосовых ответов)", "settings.voice.sub": "Субтитры следуют за речью",
    "settings.display": "Отображение", "settings.display.petals": "Лепестки сакуры", "settings.display.eyes": "Взгляд следует за курсором",
    "settings.modelSize": "Размер персонажа",
    "settings.group": "Групповой чат", "group.invite": "Пригласить", "group.leave": "Покинуть группу",
    "group.none": "Вы пока не в группе. Введите client_uid другого устройства, чтобы пригласить его и общаться вместе.",
    "group.hint": "Передайте свой client_uid, чтобы вас пригласили:",
    "settings.conn": "Соединение",
    "common.cancel": "Отмена", "common.save": "Сохранить",
    "toast.ready": "Всё готово — начнём!", "toast.interrupted": "Прервано",
    "toast.mic.denied": "Нет доступа к микрофону — проверьте разрешения браузера",
    "toast.mic.busy": "Отвечаю… воспроизведение прервано",
    "toast.img": "Изображение прикреплено", "toast.conn.lost": "Соединение потеряно, переподключение…",
    "confirm.delete.char": "Удалить персонажа «{name}»? (история чата сохранится, персонажа нельзя восстановить)",
    "confirm.delete.history": "Удалить этот диалог?",
    "adjust.title": "Быстрая настройка", "adjust.posX": "По горизонтали", "adjust.posY": "По вертикали", "adjust.reset": "Сброс",
    "settings.llm": "AI-мозг (LLM)", "llm.reconfigure": "Добавить модель",
    "llm.title": "Подключите AI-«мозг»", "llm.intro": "Hana-Companion — тело и лицо, а думающий «мозг» подключаете вы. Выберите способ:",
    "llm.ollama.title": "Локальный Ollama (рекомендуется · бесплатно и приватно)", "llm.ollama.refresh": "Обновить",
    "llm.ollama.pull": "Скачать рекомендуемую модель (~1.9 ГБ)", "llm.ollama.use": "Использовать выбранную модель",
    "llm.ollama.checking": "Ищу локальный Ollama…",
    "llm.ollama.off": "Ollama не найден. Запустите Ollama и нажмите «Обновить» — или используйте облачный ключ ниже.",
    "llm.ollama.empty": "Ollama подключён, но моделей пока нет. Начните с кнопки «Скачать рекомендуемую модель».",
    "llm.ollama.ready": "Ollama подключён · моделей: {n}",
    "llm.ollama.pulling": "Скачиваю {model}…", "llm.ollama.pull.done": "{model} готов!", "llm.ollama.pull.failed": "Загрузка прервана: {err}",
    "llm.cloud.title": "Облачный API-ключ (нужен аккаунт)", "llm.provider.custom": "Своё",
    "llm.baseUrl": "Адрес (base_url)", "llm.model": "Название модели", "llm.key": "API-ключ (сохраняется только в локальный conf.yaml)",
    "llm.cloud.save": "Проверить и сохранить", "llm.saving": "Проверяю…", "llm.saved": "AI-мозг подключён — действует сразу 🌸",
    "llm.err.model": "Укажите название модели", "llm.err.key": "Укажите API-ключ", "llm.err.baseurl": "Укажите адрес сервера",
    "llm.status.configured": "Текущая модель: {model} · готово",
    "llm.status.unconfigured": "Думающий «мозг» ещё не подключён — она не сможет отвечать. Нажмите «Добавить модель».",
    "llm.status.error": "Не удалось прочитать настройки LLM.",
    "llm.hotapply": "После сохранения применяется сразу, без перезапуска.", "llm.skip": "Позже",
    "llm.switch": "Сменить модель", "llm.switching": "Переключение…", "llm.switched": "Переключено на {model}",
    "llm.profiles.title": "Быстрое переключение", "llm.profiles.empty": "Сохранённых моделей пока нет — настройте одну, и она появится здесь.", "llm.profiles.reconfigure": "Добавить модель",
    "llm.unconfigured": "Не настроено", "llm.switch.failed": "Не удалось переключить модель", "llm.profiles.active": "Используется",
  },
  es: {
    "boot": "Encendiendo el escenario de sakura…",
    "status.online": "En línea", "status.offline": "Desconectado", "status.connecting": "Conectando…",
    "status.thinking": "Pensando…", "status.listening": "Escuchando…", "status.speaking": "Hablando…",
    "chat.title": "Chat", "chat.placeholder": "Di algo…",
    "chat.hint": "Mantén el micrófono para hablar o escribe un mensaje", "chat.hint.live": "Te escucho… suelta para enviar",
    "welcome": "¡Hola, soy {name} 🌸 Cuéntame lo que quieras~",
    "tab.chars": "Personaje", "tab.bgs": "Escena", "tab.history": "Historial",
    "char.new": "Nuevo personaje", "char.edit": "Editar", "char.delete": "Eliminar", "char.deleted": "Personaje eliminado",
    "char.switched": "Cambiado a {name}", "char.saved": "{name} guardado",
    "char.name": "Nombre visible *", "char.slug": "Slug (opcional)",
    "char.skin": "Modelo Live2D *", "char.voice": "Voz (edge-tts)",
    "char.voice.filter": "Buscar voces, p. ej. es-ES / Elvira…", "char.voice.inherit": "(Heredar configuración base)",
    "voice.female": "Femenina", "voice.male": "Masculina", "voice.other": "Otros idiomas",
    "char.avatar": "Avatar", "char.avatar.pick": "Elegir imagen", "char.persona": "Prompt de personaje *",
    "char.new.title": "Nuevo personaje", "char.edit.title": "Editar personaje",
    "char.err.name": "El nombre visible es obligatorio", "char.err.persona": "El prompt de personaje es obligatorio",
    "bg.upload": "Subir fondo", "bg.uploaded": "Fondo subido", "bg.uploading": "Subiendo, espera…", "bg.upload.progress": "Subiendo {p}%…", "bg.none": "Noche de sakura por defecto",
    "bg.delete": "Eliminar fondo", "bg.delete.confirm": "¿Eliminar el fondo «{name}»?", "bg.deleted": "Fondo eliminado", "bg.delete.failed": "No se pudo eliminar el fondo",
    "bg.fit": "Modo de ajuste", "bg.fit.cover": "Rellenar (recortar)", "bg.fit.contain": "Contener",
    "bg.fit.stretch": "Estirar", "bg.fit.original": "Tamaño original", "bg.zoom": "Zoom del fondo",
    "history.new": "Nueva conversación", "history.empty": "Aún no hay historial",
    "history.loaded": "Historial cargado",
    "settings.title": "Ajustes", "settings.character": "Personaje actual", "settings.voice": "Voz",
    "settings.voice.mute": "Silenciar (sin respuestas de voz)", "settings.voice.sub": "El subtítulo sigue a la voz",
    "settings.display": "Pantalla", "settings.display.petals": "Pétalos de sakura", "settings.display.eyes": "La mirada sigue el cursor",
    "settings.modelSize": "Tamaño del personaje",
    "settings.group": "Chat grupal", "group.invite": "Invitar", "group.leave": "Salir del grupo",
    "group.none": "Todavía no estás en un grupo. Introduce el client_uid de otro dispositivo para invitarlo y conversar juntos.",
    "group.hint": "Comparte tu client_uid para que te inviten:",
    "settings.conn": "Conexión",
    "common.cancel": "Cancelar", "common.save": "Guardar",
    "toast.ready": "¡Todo listo, empecemos!", "toast.interrupted": "Interrumpido",
    "toast.mic.denied": "Sin acceso al micrófono — revisa los permisos del navegador",
    "toast.mic.busy": "Respondiendo… reproducción interrumpida automáticamente",
    "toast.img": "Imagen adjuntada", "toast.conn.lost": "Conexión perdida, reconectando…",
    "confirm.delete.char": "¿Eliminar al personaje «{name}»? El historial se conserva, pero el personaje no se puede recuperar.",
    "confirm.delete.history": "¿Eliminar esta conversación?",
    "adjust.title": "Ajuste rápido", "adjust.posX": "Horizontal", "adjust.posY": "Vertical", "adjust.reset": "Restablecer",
    "settings.llm": "Cerebro IA (LLM)", "llm.reconfigure": "Añadir modelo",
    "llm.title": "Conecta tu «cerebro» IA", "llm.intro": "Hana-Companion es el cuerpo y la cara; el «cerebro» que piensa lo pones tú. Elige una opción:",
    "llm.ollama.title": "Ollama local (recomendado · gratis y privado)", "llm.ollama.refresh": "Actualizar",
    "llm.ollama.pull": "Descargar modelo recomendado (~1.9 GB)", "llm.ollama.use": "Usar el modelo elegido",
    "llm.ollama.checking": "Buscando Ollama local…",
    "llm.ollama.off": "No se detectó Ollama. Instálalo, ejecútalo y pulsa «Actualizar», o usa una clave de nube abajo.",
    "llm.ollama.empty": "Ollama está conectado pero aún no tiene modelos. Empieza con «Descargar modelo recomendado».",
    "llm.ollama.ready": "Ollama conectado · {n} modelos disponibles",
    "llm.ollama.pulling": "Descargando {model}…", "llm.ollama.pull.done": "¡{model} está listo!", "llm.ollama.pull.failed": "Descarga interrumpida: {err}",
    "llm.cloud.title": "Clave de API en la nube (requiere cuenta)", "llm.provider.custom": "Personalizado",
    "llm.baseUrl": "Endpoint (base_url)", "llm.model": "Nombre del modelo", "llm.key": "Clave de API (solo se guarda en conf.yaml local)",
    "llm.cloud.save": "Probar y guardar", "llm.saving": "Probando…", "llm.saved": "Cerebro IA conectado — efectivo al instante 🌸",
    "llm.err.model": "Escribe el nombre del modelo", "llm.err.key": "Escribe la clave de API", "llm.err.baseurl": "Escribe la URL del endpoint",
    "llm.status.configured": "Modelo actual: {model} · listo",
    "llm.status.unconfigured": "Todavía no hay «cerebro» conectado — no podrá responder. Pulsa «Añadir modelo».",
    "llm.status.error": "No se pudo leer la configuración del LLM.",
    "llm.hotapply": "Se aplica al guardar, sin reiniciar.", "llm.skip": "Más tarde",
    "llm.switch": "Cambiar modelo", "llm.switching": "Cambiando…", "llm.switched": "Cambiado a {model}",
    "llm.profiles.title": "Cambio rápido", "llm.profiles.empty": "Aún no hay modelos guardados: configura uno y aparecerá aquí.", "llm.profiles.reconfigure": "Añadir modelo",
    "llm.unconfigured": "Sin configurar", "llm.switch.failed": "No se pudo cambiar el modelo", "llm.profiles.active": "En uso",
  },
};

const store = {
  get(k, d) { try { const v = localStorage.getItem("hana." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("hana." + k, JSON.stringify(v)); } catch { /* ignore */ } },
};

let lang = store.get("lang", "zh");
const LANG_TAGS = { zh: "zh-CN", "zh-TW": "zh-TW", en: "en", ja: "ja", ko: "ko", ru: "ru", es: "es" };
const LANG_TITLES = {
  zh: "Hana-Companion · 花影舞台", "zh-TW": "Hana-Companion · 花影舞台", en: "Hana-Companion · Sakura Stage",
  ja: "Hana-Companion · 桜のステージ", ko: "Hana-Companion · 사쿠라 스테이지",
  ru: "Hana-Companion · Сцена сакуры", es: "Hana-Companion · Escenario Sakura",
};
const t = (k, vars) => {
  let s = (I18N[lang] && I18N[lang][k]) ?? I18N.zh[k] ?? k;
  if (vars) for (const [key, val] of Object.entries(vars)) s = s.replaceAll("{" + key + "}", val);
  return s;
};

/* ---------------- state ---------------- */
const state = {
  connected: false,
  clientUid: "",
  confUid: null,
  confName: "",
  confFilename: "conf.yaml",
  modelInfo: null,
  characters: [],
  skins: [],
  voices: [],
  historyUid: null,
  histories: [],
  groupMembers: [],
  isGroupOwner: false,
  muted: store.get("mute", false),
  subtitleOn: store.get("subtitle", true),
  petalsOn: store.get("petals", true),
  eyesOn: store.get("eyes", true),
  bgFile: store.get("bg", null),
  bgFit: store.get("bgFit", "cover"),
  bgZoom: store.get("bgZoom", 1),
  modelScale: store.get("modelScale", 1),
  modelX: store.get("modelX", 0),
  modelY: store.get("modelY", 0),
  attachedImages: [], // {url(dataURL), data(base64 body), mime}
  llmCfg: null, // last known /api/llm-config result (drawer status + wizard seeding)
  llmProfiles: [], // saved quick-switch profiles from /api/llm-profiles
  thinking: false,
  speaking: false,
  heardText: "",
  mobile: window.innerWidth <= 860,
};

/* ---------------- toast & status ---------------- */
let toastTimer = null;
function toast(msg, isError = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("is-error", isError);
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove("show"); setTimeout(() => (el.hidden = true), 350); }, 2400);
}

function setStatus(key, cls = "") {
  const pill = $("#statusPill");
  pill.className = "status-pill" + (cls ? " is-" + cls : "");
  $("#statusText").textContent = t(key);
}

let statusLineTimer = null;
function stageStatus(text, ms = 4000) {
  const el = $("#stageStatusLine");
  if (!text) { el.hidden = true; return; }
  $("#stageStatusText").textContent = text;
  el.hidden = false;
  clearTimeout(statusLineTimer);
  statusLineTimer = setTimeout(() => (el.hidden = true), ms);
}

/* ============================================================
   WebSocket client
   ============================================================ */
let ws = null;
let wsRetryDelay = 1000;
let heartbeatTimer = null;

function wsUrl() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/client-ws`;
}

function wsSend(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function connectWS() {
  setStatus("status.connecting", "busy");
  try { ws && ws.close(); } catch { /* ignore */ }
  ws = new WebSocket(wsUrl());

  ws.onopen = () => {
    state.connected = true;
    wsRetryDelay = 1000;
    setStatus("status.online");
    heartbeatTimer = setInterval(() => wsSend({ type: "heartbeat" }), 25000);
    wsSend({ type: "fetch-backgrounds" });
    wsSend({ type: "request-group-info" });
  };

  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    routeMessage(msg);
  };

  ws.onclose = () => {
    state.connected = false;
    clearInterval(heartbeatTimer);
    setStatus("status.offline", "error");
    toast(t("toast.conn.lost"), true);
    setTimeout(connectWS, wsRetryDelay);
    wsRetryDelay = Math.min(wsRetryDelay * 2, 10000);
  };

  ws.onerror = () => { try { ws.close(); } catch { /* ignore */ } };
}

function routeMessage(msg) {
  switch (msg.type) {
    case "set-model-and-conf":
      onSetModelAndConf(msg);
      break;
    case "full-text":
      onFullText(msg);
      break;
    case "user-input-transcription":
      removeThinking();
      addMsg("me", msg.text || "…", { voice: true });
      break;
    case "audio":
      enqueueAudio(msg);
      break;
    case "control":
      onControl(msg.text);
      break;
    case "group-update":
      state.groupMembers = msg.members || [];
      state.isGroupOwner = !!msg.is_owner;
      renderGroup();
      break;
    case "history-list":
      state.histories = msg.histories || [];
      renderHistoryList();
      break;
    case "history-data":
      loadHistoryMessages(msg.messages || []);
      break;
    case "new-history-created":
      state.historyUid = msg.history_uid;
      historyCreating = false;
      break;
    case "history-deleted":
      if (msg.history_uid === state.historyUid) {
        state.historyUid = null;
        clearChat();
      }
      wsSend({ type: "fetch-history-list" });
      break;
    case "background-files":
      renderBackgrounds(msg.files || []);
      break;
    case "config-switched":
      toast(t("char.switched", { name: state.confName }));
      break;
    case "backend-synth-complete":
      break;
    case "heartbeat-ack":
      break;
    case "error":
      removeThinking();
      setStatus("status.online");
      stageStatus(msg.message || "Error");
      toast(msg.message || "Error", true);
      break;
    default:
      break;
  }
}

function onSetModelConfCore(msg) {
  const first = state.confUid === null;
  const confChanged = !first && state.confUid !== msg.conf_uid;
  state.confUid = msg.conf_uid;
  state.confName = msg.conf_name;
  if (msg.client_uid) state.clientUid = msg.client_uid;
  $("#nameTagText").textContent = state.confName || "";
  $("#modelBadgeText").textContent = "Live2D · " + (msg.model_info?.name || "");
  $("#modelBadge").title = msg.model_info?.name || "";
  if (confChanged) state.historyUid = null;
  if (first || confChanged) {
    clearChat();
    addSysMsg(t("welcome", { name: state.confName }));
  }
  loadLive2DModel(msg.model_info);
  const char = state.characters.find((c) => c.conf_uid === state.confUid);
  if (char) {
    state.confFilename = char.filename;
    state.confName = char.conf_name || state.confName;
  }
  renderCharCards();
  renderCurrentCharCard();
  renderConnInfo();
  wsSend({ type: "fetch-history-list" });
}

function onSetModelAndConf(msg) {
  const modelChanged = !state.modelInfo || state.modelInfo.url !== msg.model_info?.url;
  const confChanged = state.confUid !== msg.conf_uid;
  onSetModelConfCore(msg);
  if (confChanged) renderCharCards();
  if (modelChanged || confChanged) hideBoot();
}

function onFullText(msg) {
  const text = msg.text || "";
  if (text === "Connection established") return;
  if (text === "Thinking..." || text === "AI wants to speak something...") {
    showThinking();
    return;
  }
  stageStatus(text, 5000);
}

function onControl(text) {
  switch (text) {
    case "conversation-chain-start":
      state.heardText = "";
      showThinking();
      setStatus("status.thinking", "busy");
      break;
    case "conversation-chain-end":
      removeThinking();
      if (!state.speaking) setStatus("status.online");
      break;
    case "interrupt":
      stopAllAudio();
      removeThinking();
      setStatus("status.online");
      break;
    case "start-mic":
    case "stop-mic":
    case "mic-audio-end":
    default:
      break;
  }
}

/* ============================================================
   Live2D rendering
   ============================================================ */
let pixiApp = null;
let live2dModel = null;
let modelUrl = null;
let mouthVolume = 0;
let layoutFrame = 0;

async function initPixi() {
  pixiApp = new PIXI.Application({
    view: $("#live2dCanvas"),
    backgroundAlpha: 0,
    autoDensity: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    resizeTo: window,
  });
}

async function loadLive2DModel(modelInfo) {
  if (!modelInfo || !modelInfo.url || !window.PIXI?.live2d) return;
  if (modelUrl === modelInfo.url && live2dModel) {
    layoutModel();
    return;
  }
  modelUrl = modelInfo.url;
  state.modelInfo = modelInfo;
  console.log("[hana] loading Live2D model:", modelInfo.url);
  try {
    const model = await PIXI.live2d.Live2DModel.from(modelInfo.url);
    if (live2dModel) { pixiApp.stage.removeChild(live2dModel); live2dModel.destroy(); }
    live2dModel = model;
    pixiApp.stage.addChild(model);
    layoutFrame = 1; // re-layout a few frames in, once pose data is live
    const im = model.internalModel;
    im.on("beforeModelUpdate", onBeforeModelUpdate);
    model.on("hit", onModelHit);
    layoutModel();
    console.log("[hana] Live2D model on stage:", modelInfo.name, "stage.children=", pixiApp.stage.children.length);
  } catch (err) {
    console.error("[hana] Live2D load failed:", err);
    stageStatus("Live2D 模型加载失败: " + modelInfo.name);
  }
}

/* Fit model to stage using PIXI local bounds (model canvas units, NOT raw
   core vertices — those are normalized and would inflate the scale ~4800x),
   multiplied by the user size preference. Anchored bottom-center. */
function layoutModel() {
  if (!live2dModel || !pixiApp) return;
  const model = live2dModel;
  const W = pixiApp.renderer.width / pixiApp.renderer.resolution;
  const H = pixiApp.renderer.height / pixiApp.renderer.resolution;
  const b = model.getLocalBounds();
  if (!isFinite(b.width) || b.width <= 0 || !isFinite(b.height) || b.height <= 0) return;
  const s = Math.min((H * 0.96) / b.height, (W * 0.92) / b.width) * (state.modelScale || 1);
  model.scale.set(s);
  model.x = W / 2 - (b.x + b.width / 2) * s + (state.modelX || 0) * W;
  model.y = H * 0.99 - (b.y + b.height) * s + (state.modelY || 0) * H;
  positionNameTag();
}

/* Floating name tag shown above the model's head on click. Font size tracks
   model bounds so it scales with the character; position follows the model
   every frame while visible (motions move the head). */
const nameTagEl = $("#nameTag");
let nameTagTimer = null;
function positionNameTag() {
  if (nameTagEl.hidden || !live2dModel) return;
  const b = live2dModel.getBounds();
  if (!isFinite(b.width) || b.width <= 0) return;
  const fs = Math.max(13, Math.min(42, b.height * 0.055));
  nameTagEl.style.fontSize = fs.toFixed(1) + "px";
  nameTagEl.style.left = (b.x + b.width / 2) + "px";
  nameTagEl.style.top = Math.max(8, b.y - fs * 0.4) + "px";
}
function showNameTag() {
  if (!state.confName) return;
  $("#nameTagText").textContent = state.confName;
  nameTagEl.hidden = false;
  requestAnimationFrame(() => nameTagEl.classList.add("show"));
  positionNameTag();
  clearTimeout(nameTagTimer);
  nameTagTimer = setTimeout(() => {
    nameTagEl.classList.remove("show");
    setTimeout(() => (nameTagEl.hidden = true), 480);
  }, 3000);
}

function onBeforeModelUpdate() {
  const im = live2dModel.internalModel;
  const cm = im.coreModel;
  // lip-sync (covers common ids; unknown ids are ignored by the core)
  if (mouthVolume > 0) {
    cm.addParameterValueById("ParamMouthOpenY", mouthVolume);
    cm.addParameterValueById("ParamA", mouthVolume);
    cm.addParameterValueById("ParamMouthOpen", mouthVolume);
  }
  if (!state.eyesOn && im.focusController) { im.focusController.x = 0; im.focusController.y = 0; }
  if (!nameTagEl.hidden) positionNameTag();
  if (layoutFrame > 0 && ++layoutFrame === 6) { layoutModel(); layoutFrame = 0; }
}

function onModelHit(hitAreas) {
  if (performance.now() < suppressHitUntil) return; // just finished dragging — not a tap
  showNameTag();
  if (!live2dModel || !state.modelInfo) return;
  const taps = state.modelInfo.tapMotions || {};
  let group, index;
  for (const key of Object.keys(taps)) {
    const g = taps[key];
    for (const groupName of Object.keys(g)) { group = groupName; index = g[groupName]; break; }
    if (group !== undefined) break;
  }
  try {
    if (group !== undefined) live2dModel.motion(group, index, 3);
    else live2dModel.motion("Idle", undefined, 3);
  } catch { /* ignore */ }
}

function setExpression(expr) {
  if (!live2dModel) return;
  try {
    if (typeof expr === "number") live2dModel.expression(expr);
    else if (typeof expr === "string") live2dModel.expression(expr);
  } catch { /* model may have no expressions */ }
}

window.addEventListener("resize", () => {
  state.mobile = window.innerWidth <= 860;
  if (pixiApp) pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
  layoutModel();
  applyBackgroundSize();
});

/* ============================================================
   Audio playback queue
   ============================================================ */
let audioCtx = null;
const audioQueue = [];
let playingSource = null;
let playingGain = null;
let playStartAt = 0;
let playVolumes = [];
let playSliceMs = 20;
let playRaf = 0;
let playEndResolve = null;
let subtitleTimer = null;

function ensureAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}
["pointerdown", "keydown", "touchstart"].forEach((ev) =>
  window.addEventListener(ev, () => { if (audioCtx) ensureAudioCtx(); }, { once: false, passive: true })
);

function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function enqueueAudio(payload) {
  audioQueue.push(payload);
  if (!state.speaking) playNextAudio();
}

function playNextAudio() {
  const p = audioQueue.shift();
  if (!p) {
    state.speaking = false;
    updateInterruptBtn();
    if (state.connected) setStatus("status.online");
    hideSubtitle();
    return;
  }
  state.speaking = true;
  updateInterruptBtn();
  removeThinking();
  setStatus("status.speaking", "busy");

  const display = p.display_text || {};
  const text = display.text || "";
  if (text) {
    state.heardText += (state.heardText ? " " : "") + text;
    addMsg("ai", text, { name: display.name, avatar: display.avatar });
  }
  applyActions(p.actions);

  const subtitleText = p.subtitle_text || text;
  const canPlay = p.audio && !state.muted;
  if (canPlay) {
    wsSend({ type: "audio-play-start", display_text: p.display_text });
    playAudioPayload(p, subtitleText).then(() => playNextAudio());
  } else {
    // silent path: show subtitle briefly per text length
    if (subtitleText && state.subtitleOn) {
      showSubtitle(subtitleText);
      clearTimeout(subtitleTimer);
      subtitleTimer = setTimeout(hideSubtitle, Math.max(1600, subtitleText.length * 140));
    }
    setTimeout(() => playNextAudio(), Math.min(1200, 300 + subtitleText.length * 40));
  }
}

async function playAudioPayload(p, subtitleText) {
  const ctx = ensureAudioCtx();
  let audioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(base64ToArrayBuffer(p.audio));
  } catch (err) {
    console.error("decode audio failed", err);
    return;
  }
  playVolumes = p.volumes || [];
  playSliceMs = p.slice_length || 20;
  if (state.subtitleOn && subtitleText) showSubtitle(subtitleText);

  return new Promise((resolve) => {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 1;
    src.buffer = audioBuffer;
    src.connect(gain).connect(ctx.destination);
    playingSource = src;
    playingGain = gain;
    playStartAt = performance.now();
    playEndResolve = resolve;

    const tick = () => {
      if (!playingSource) return;
      const elapsed = performance.now() - playStartAt;
      const idx = Math.floor(elapsed / playSliceMs);
      mouthVolume = playVolumes.length ? (playVolumes[idx] ?? 0) : 0;
      playRaf = requestAnimationFrame(tick);
    };
    playRaf = requestAnimationFrame(tick);

    src.onended = () => {
      if (playEndResolve !== resolve) return;
      cleanupPlayback();
      resolve();
    };
    src.start();
  });
}

function cleanupPlayback() {
  cancelAnimationFrame(playRaf);
  playRaf = 0;
  playingSource = null;
  playingGain = null;
  playEndResolve = null;
  mouthVolume = 0;
}

function stopAllAudio() {
  audioQueue.length = 0;
  if (playingSource) {
    const s = playingSource;
    const settle = playEndResolve;
    cleanupPlayback();
    hideSubtitle();
    try { s.stop(); } catch { /* already stopped */ }
    // settle the awaiting playNextAudio() chain now; onended's guard ignores it
    if (settle) settle();
  }
  state.speaking = false;
  updateInterruptBtn();
}

function showSubtitle(text) {
  $("#subtitleText").textContent = text;
  $("#subtitle").hidden = false;
}
function hideSubtitle() {
  $("#subtitle").hidden = true;
}

function applyActions(actions) {
  if (!actions) return;
  const exprs = actions.expressions;
  if (Array.isArray(exprs) && exprs.length) setExpression(exprs[0]);
}

function updateInterruptBtn() {
  $("#dockInterrupt").classList.toggle("is-hidden", !state.speaking && !audioQueue.length);
}

/* ============================================================
   Interrupt
   ============================================================ */
function interruptConversation() {
  stopAllAudio();
  removeThinking();
  wsSend({ type: "interrupt-signal", text: state.heardText });
  state.heardText = "";
  setStatus("status.online");
  toast(t("toast.interrupted"));
}
$("#dockInterrupt").addEventListener("click", interruptConversation);

/* ============================================================
   Chat UI
   ============================================================ */
function avatarEl(role, opts = {}) {
  const span = document.createElement("span");
  span.className = "msg__avatar";
  if (role === "ai" && opts.avatar) {
    const img = document.createElement("img");
    img.src = opts.avatar.startsWith("/") ? opts.avatar : "/avatars/" + opts.avatar;
    img.alt = "";
    span.appendChild(img);
  } else if (role === "ai") {
    span.textContent = "🌸";
  } else {
    span.textContent = "🙂";
  }
  return span;
}

function addMsg(role, text, opts = {}) {
  const list = $("#chatList");
  const msg = document.createElement("div");
  msg.className = "msg msg--" + (role === "ai" ? "ai" : role === "sys" ? "sys" : role === "tool" ? "tool" : "me");
  msg.appendChild(avatarEl(role === "ai" ? "ai" : "me", opts));

  const col = document.createElement("div");
  col.className = "msg__col";
  const name = opts.name || (role === "ai" ? state.confName : "");
  if (role === "ai" && name) {
    const meta = document.createElement("div");
    meta.className = "msg__meta";
    meta.textContent = name + (opts.voice ? " · 🎤" : "");
    col.appendChild(meta);
  }
  const bubble = document.createElement("div");
  bubble.className = "msg__bubble";
  bubble.textContent = text;
  if (role === "me" && opts.voice) bubble.classList.add("is-voice");
  col.appendChild(bubble);

  if (role === "me" && opts.images) {
    for (const img of opts.images) {
      const el = document.createElement("img");
      el.className = "msg__img";
      el.src = img;
      el.alt = "";
      bubble.appendChild(el);
    }
  }
  msg.appendChild(col);
  list.appendChild(msg);
  list.scrollTop = list.scrollHeight;
  return msg;
}

function addSysMsg(text) {
  const list = $("#chatList");
  const msg = document.createElement("div");
  msg.className = "msg msg--sys";
  const bubble = document.createElement("div");
  bubble.className = "msg__bubble";
  bubble.textContent = text;
  msg.appendChild(bubble);
  list.appendChild(msg);
  list.scrollTop = list.scrollHeight;
}

let thinkingEl = null;
function showThinking() {
  state.thinking = true;
  if (thinkingEl) return;
  const list = $("#chatList");
  thinkingEl = document.createElement("div");
  thinkingEl.className = "msg msg--ai msg--thinking";
  thinkingEl.innerHTML = `<span class="msg__avatar">🌸</span><div class="msg__bubble"><i></i><i></i><i></i></div>`;
  list.appendChild(thinkingEl);
  list.scrollTop = list.scrollHeight;
}
function removeThinking() {
  state.thinking = false;
  if (thinkingEl) { thinkingEl.remove(); thinkingEl = null; }
}

function clearChat() {
  $("#chatList").innerHTML = "";
  thinkingEl = null;
  removeThinking();
}

/* ---- text input ---- */
function autoGrow() {
  const ta = $("#chatText");
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
}

let historyCreating = false;
function ensureHistory() {
  if (!state.historyUid && !historyCreating) {
    historyCreating = true;
    wsSend({ type: "create-new-history" });
    setTimeout(() => (historyCreating = false), 3000);
  }
}

function sendText() {
  const ta = $("#chatText");
  const text = ta.value.trim();
  const images = state.attachedImages.slice();
  if (!text && !images.length) return;
  if (!state.connected) { toast(t("status.offline"), true); return; }
  ensureHistory();
  if (state.speaking) interruptConversation();
  addMsg("me", text || "🖼️", { images: images.map((i) => i.url) });
  const payload = { type: "text-input", text };
  if (images.length) {
    payload.images = images.map((i) => ({ source: "upload", data: i.url, mime_type: i.mime }));
  }
  wsSend(payload);
  ta.value = "";
  autoGrow();
  clearAttachments();
  showThinking();
  setStatus("status.thinking", "busy");
}

$("#chatText").addEventListener("input", autoGrow);
$("#chatText").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
});
$("#btnSend").addEventListener("click", sendText);

/* ---- image attach ---- */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1024;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderAttachments() {
  const row = $("#attachRow");
  row.innerHTML = "";
  row.hidden = state.attachedImages.length === 0;
  state.attachedImages.forEach((img, idx) => {
    const chip = document.createElement("span");
    chip.className = "attach-chip";
    const el = document.createElement("img");
    el.src = img.url;
    el.alt = "";
    const x = document.createElement("button");
    x.className = "attach-chip__x";
    x.textContent = "×";
    x.setAttribute("aria-label", "remove");
    x.addEventListener("click", () => {
      state.attachedImages.splice(idx, 1);
      renderAttachments();
    });
    chip.append(el, x);
    row.appendChild(chip);
  });
}

function clearAttachments() {
  state.attachedImages = [];
  renderAttachments();
}

$("#btnAttach").addEventListener("click", () => $("#fileInput").click());
$("#fileInput").addEventListener("change", async (e) => {
  for (const file of [...e.target.files]) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const url = await compressImage(file);
      state.attachedImages.push({ url, mime: "image/jpeg" });
    } catch { /* skip bad file */ }
  }
  e.target.value = "";
  renderAttachments();
  if (state.attachedImages.length) toast(t("toast.img"));
});

/* ============================================================
   Microphone (PTT)
   ============================================================ */
let micStream = null;
let micCtx = null;
let micProc = null;
let micActive = false;

function downsample(buffer, fromRate, toRate) {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const outLen = Math.floor(buffer.length / ratio);
  const result = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(Math.floor((i + 1) * ratio), buffer.length);
    let sum = 0;
    for (let j = start; j < end; j++) sum += buffer[j];
    result[i] = sum / Math.max(end - start, 1);
  }
  return result;
}

async function startMic() {
  if (micActive) return;
  if (!state.connected) { toast(t("status.offline"), true); return; }
  if (state.speaking) { interruptConversation(); toast(t("toast.mic.busy")); }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
  } catch {
    toast(t("toast.mic.denied"), true);
    return;
  }
  micActive = true;
  ensureHistory();
  micCtx = new (window.AudioContext || window.webkitAudioContext)();
  const src = micCtx.createMediaStreamSource(micStream);
  micProc = micCtx.createScriptProcessor(4096, 1, 1);
  const muteGain = micCtx.createGain();
  muteGain.gain.value = 0;
  micProc.onaudioprocess = (e) => {
    if (!micActive) return;
    const input = e.inputBuffer.getChannelData(0);
    const out = downsample(input, micCtx.sampleRate, 16000);
    wsSend({ type: "mic-audio-data", audio: Array.from(out) });
  };
  src.connect(micProc);
  micProc.connect(muteGain);
  muteGain.connect(micCtx.destination);
  setMicUI(true);
}

function stopMic() {
  if (!micActive) return;
  micActive = false;
  try { micProc && micProc.disconnect(); } catch { /* ignore */ }
  try { micStream && micStream.getTracks().forEach((tr) => tr.stop()); } catch { /* ignore */ }
  try { micCtx && micCtx.close(); } catch { /* ignore */ }
  micProc = null; micStream = null; micCtx = null;
  setMicUI(false);
  wsSend({ type: "mic-audio-end" });
  showThinking();
  setStatus("status.thinking", "busy");
}

function setMicUI(on) {
  $("#btnMic").classList.toggle("is-listening", on);
  $("#btnMic").setAttribute("aria-pressed", String(on));
  $("#dockMic").classList.toggle("is-active", on);
  $("#dockMic").setAttribute("aria-pressed", String(on));
  $("#micHint").classList.toggle("is-live", on);
  $("#micHint").textContent = on ? t("chat.hint.live") : t("chat.hint");
  if (on) setStatus("status.listening", "listening");
  else if (state.connected) setStatus(state.speaking ? "status.speaking" : "status.online", state.speaking ? "busy" : "");
}

/* PTT: hold on desktop chat mic; toggle everywhere else */
let pttHeld = false;
const btnMic = $("#btnMic");
btnMic.addEventListener("pointerdown", (e) => { e.preventDefault(); pttHeld = true; startMic(); });
window.addEventListener("pointerup", () => { if (pttHeld) { pttHeld = false; stopMic(); } });
btnMic.addEventListener("pointerleave", () => { if (pttHeld) { pttHeld = false; stopMic(); } });
btnMic.addEventListener("contextmenu", (e) => e.preventDefault());
$("#dockMic").addEventListener("click", () => (micActive ? stopMic() : startMic()));
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target === document.body && !micActive) { e.preventDefault(); startMic(); }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "Space" && micActive) { e.preventDefault(); stopMic(); }
});

/* ============================================================
   REST helpers
   ============================================================ */
async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  let body = null;
  try { body = await res.json(); } catch { body = null; }
  if (!res.ok) throw new Error((body && body.error) || res.statusText || "request failed");
  return body;
}

/* ============================================================
   Characters
   ============================================================ */
async function loadCharacters() {
  try {
    const [chars, skins, voices] = await Promise.all([
      api("/api/characters"),
      api("/api/live2d-skins"),
      api("/api/voices?full=1"), // live edge-tts list; backend falls back to curated on failure
    ]);
    state.characters = chars.characters || [];
    state.skins = skins.skins || [];
    state.voices = voices.voices || [];
    renderCharCards();
    renderCurrentCharCard();
    // refresh an already-open editor with the (possibly late) full voice list
    if (!$("#charModalBackdrop").hidden) {
      fillVoiceSelect(editTarget?.voice || "", $("#fVoiceFilter").value);
    }
  } catch (err) {
    console.error("load characters failed:", err);
  }
}

function charThumb(c) {
  if (c.avatar) return { src: c.avatar.startsWith("/") ? c.avatar : "/avatars/" + c.avatar, cover: true };
  const skin = state.skins.find((s) => s.name === c.live2d_model_name);
  if (skin && skin.thumbnail) return { src: skin.thumbnail, cover: true };
  return null;
}

function renderCharCards() {
  const ul = $("#charList");
  ul.innerHTML = "";
  for (const c of state.characters) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "card" + (c.conf_uid === state.confUid ? " is-active" : "");
    btn.setAttribute("aria-selected", String(c.conf_uid === state.confUid));

    const art = document.createElement("span");
    art.className = "card__art" + (charThumb(c)?.cover ? " card__art--cover" : "");
    const thumb = charThumb(c);
    if (thumb) {
      const img = document.createElement("img");
      img.src = thumb.src;
      img.alt = c.conf_name || "";
      img.loading = "lazy";
      art.appendChild(img);
    } else {
      art.textContent = (c.conf_name || "?").slice(0, 1);
      art.style.font = "600 34px var(--f-display)";
      art.style.color = "var(--text-mid)";
    }
    const name = document.createElement("span");
    name.className = "card__name";
    const nameSpan = document.createElement("span");
    nameSpan.textContent = c.conf_name || c.slug || "?";
    name.appendChild(nameSpan);
    const tag = document.createElement("span");
    tag.className = "card__tag";
    tag.textContent = c.is_base ? "base" : (c.live2d_model_name || "");
    btn.append(art, name, tag);
    btn.addEventListener("click", () => switchCharacter(c));
    li.appendChild(btn);
    ul.appendChild(li);
  }
}

function switchCharacter(c) {
  if (!state.connected) { toast(t("status.offline"), true); return; }
  if (c.conf_uid === state.confUid) return;
  stopAllAudio();
  removeThinking();
  wsSend({ type: "switch-config", file: c.filename });
  state.confFilename = c.filename;
}

function renderCurrentCharCard() {
  const box = $("#currentCharCard");
  box.innerHTML = "";
  const c = state.characters.find((x) => x.conf_uid === state.confUid) ||
    state.characters.find((x) => x.is_base);
  if (!c) { box.textContent = state.confName || "—"; return; }
  const row = document.createElement("div");
  row.className = "setting__card-row";
  const av = document.createElement("div");
  const thumb = charThumb(c);
  if (thumb) {
    const img = document.createElement("img");
    img.className = "setting__card-avatar";
    img.src = thumb.src;
    img.alt = "";
    av.appendChild(img);
  } else {
    av.className = "setting__card-avatar";
    av.style.display = "grid";
    av.style.placeItems = "center";
    av.textContent = (c.conf_name || "?").slice(0, 1);
  }
  const info = document.createElement("div");
  const nm = document.createElement("div");
  nm.className = "setting__card-name";
  nm.textContent = c.conf_name || "—";
  const sub = document.createElement("div");
  sub.className = "setting__card-sub";
  sub.textContent = `${c.is_base ? "base · " : ""}${c.live2d_model_name || ""}${c.voice ? " · " + c.voice : ""}`;
  info.append(nm, sub);
  row.append(av, info);
  box.appendChild(row);
  if (c.persona_prompt) {
    const p = document.createElement("div");
    p.className = "setting__card-persona";
    p.textContent = c.persona_prompt;
    box.appendChild(p);
  }
  $("#btnDeleteChar").classList.toggle("is-hidden", !!c.is_base);
}

function renderConnInfo() {
  $("#connInfo").textContent =
    `client_uid: ${state.clientUid || "—"}\nconf_uid: ${state.confUid || "—"}\nmodel: ${state.modelInfo?.name || "—"}\nws: ${wsUrl()}`;
}

/* ---- character editor modal ---- */
let editTarget = null; // null = create; else character object
let avatarFileName = null;

function fillSkinSelect(selected) {
  const sel = $("#fSkin");
  sel.innerHTML = "";
  for (const s of state.skins) {
    const opt = document.createElement("option");
    opt.value = s.name;
    opt.textContent = s.name;
    if (s.name === selected) opt.selected = true;
    sel.appendChild(opt);
  }
}

/* Voice option localization: labels are rebuilt from ShortName + locale +
   gender so they follow the UI language (backend label is English-only).
   Locale names use Intl.DisplayNames; person names are extracted from the
   ShortName (e.g. "zh-TW-HsiaoChenNeural" -> "Hsiao Chen"). */
const localeNameCache = new Map(); // `${lang}|${locale}` -> display name
function localeDisplayName(locale) {
  if (!locale) return locale;
  const key = lang + "|" + locale;
  if (localeNameCache.has(key)) return localeNameCache.get(key);
  let name = locale;
  try {
    const dn = new Intl.DisplayNames([LANG_TAGS[lang] || lang, "en"], { type: "language" });
    name = dn.of(locale) || locale;
  } catch { /* keep raw code */ }
  localeNameCache.set(key, name);
  return name;
}

function voicePersonName(value) {
  let name = String(value || "").replace(/Neural$/i, "");
  name = name.replace(/^[A-Za-z]{2,3}-[A-Za-z]{2,4}-/, "");
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function voiceDisplayName(v) {
  const name = voicePersonName(v.value);
  const gender = v.gender === "Female" ? t("voice.female") : v.gender === "Male" ? t("voice.male") : (v.gender || "");
  return gender ? `${name} · ${gender}` : name;
}

function fillVoiceSelect(selected, filter = "") {
  const sel = $("#fVoice");
  sel.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = t("char.voice.inherit");
  if (!selected) none.selected = true;
  sel.appendChild(none);
  const f = filter.trim().toLowerCase();
  const groups = new Map();
  for (const v of state.voices) {
    const label = voiceDisplayName(v);
    if (f) {
      const haystacks = [v.value, label, localeDisplayName(v.locale)];
      if (!haystacks.some((s) => (s || "").toLowerCase().includes(f))) continue;
    }
    const locale = v.locale || "other";
    if (!groups.has(locale)) groups.set(locale, []);
    groups.get(locale).push({ v, label });
  }
  let found = !selected;
  for (const [locale, items] of groups) {
    const og = document.createElement("optgroup");
    og.label = `${locale === "other" ? t("voice.other") : localeDisplayName(locale)} (${items.length})`;
    for (const { v, label } of items) {
      const opt = document.createElement("option");
      opt.value = v.value;
      opt.textContent = label;
      if (v.value === selected) { opt.selected = true; found = true; }
      og.appendChild(opt);
    }
    sel.appendChild(og);
  }
  // keep a voice that isn't in the list (e.g. set in conf.yaml or a filter mismatch)
  if (!found) {
    const opt = document.createElement("option");
    opt.value = selected;
    opt.textContent = selected;
    opt.selected = true;
    sel.appendChild(opt);
  }
}

function openCharModal(character) {
  editTarget = character || null;
  avatarFileName = character?.avatar || null;
  $("#charModalTitle").textContent = character ? t("char.edit.title") : t("char.new.title");
  $("#fName").value = character?.conf_name || "";
  $("#fSlug").value = character?.slug || "";
  $("#fSlug").disabled = !!character;
  fillSkinSelect(character?.live2d_model_name || state.skins[0]?.name || "");
  $("#fVoiceFilter").value = "";
  fillVoiceSelect(character?.voice || "");
  $("#fPersona").value = character?.persona_prompt || "";
  const preview = $("#fAvatarPreview");
  if (avatarFileName) {
    preview.src = avatarFileName.startsWith("/") ? avatarFileName : "/avatars/" + avatarFileName;
    preview.hidden = false;
  } else {
    preview.hidden = true;
    preview.src = "";
  }
  $("#charFormError").hidden = true;
  $("#charModalBackdrop").hidden = false;
  requestAnimationFrame(() => $("#charModalBackdrop").classList.add("show"));
}

function closeCharModal() {
  $("#charModalBackdrop").classList.remove("show");
  setTimeout(() => ($("#charModalBackdrop").hidden = true), 250);
}

$("#btnNewChar").addEventListener("click", () => openCharModal(null));
$("#fVoiceFilter").addEventListener("input", (e) => {
  fillVoiceSelect(editTarget?.voice || "", e.target.value);
});
$("#btnEditChar").addEventListener("click", () => {
  const c = state.characters.find((x) => x.conf_uid === state.confUid) || state.characters.find((x) => x.is_base);
  if (c) openCharModal(c);
});
$("#btnCharClose").addEventListener("click", closeCharModal);
$("#btnCharCancel").addEventListener("click", closeCharModal);
$("#charModalBackdrop").addEventListener("click", (e) => {
  if (e.target === $("#charModalBackdrop")) closeCharModal();
});
$("#btnAvatarPick").addEventListener("click", () => $("#fAvatarInput").click());
$("#fAvatarInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const fd = new FormData();
    fd.append("file", file);
    if (editTarget) fd.append("conf_uid", editTarget.slug || "");
    const res = await api("/api/character/avatar", { method: "POST", body: fd });
    avatarFileName = res.filename;
    const preview = $("#fAvatarPreview");
    preview.src = "/avatars/" + avatarFileName + "?t=" + Date.now();
    preview.hidden = false;
  } catch (err) {
    toast(err.message, true);
  }
});

$("#btnDeleteChar").addEventListener("click", async () => {
  const c = state.characters.find((x) => x.conf_uid === state.confUid);
  if (!c || c.is_base) return;
  if (!confirm(t("confirm.delete.char", { name: c.conf_name }))) return;
  try {
    await api("/api/characters/" + encodeURIComponent(c.filename), { method: "DELETE" });
    toast(t("char.deleted"));
    await loadCharacters();
    if (state.confUid === c.conf_uid) {
      const base = state.characters.find((x) => x.is_base);
      if (base) switchCharacter(base);
    }
  } catch (err) {
    toast(err.message, true);
  }
});

$("#btnCharSave").addEventListener("click", async () => {
  const name = $("#fName").value.trim();
  const persona = $("#fPersona").value.trim();
  const skin = $("#fSkin").value;
  const voice = $("#fVoice").value;
  const slug = $("#fSlug").value.trim();
  const err = $("#charFormError");
  if (!name) { err.textContent = t("char.err.name"); err.hidden = false; return; }
  if (!persona) { err.textContent = t("char.err.persona"); err.hidden = false; return; }
  if (!skin) { err.textContent = t("char.err.name"); err.hidden = false; return; }

  const body = {
    conf_name: name,
    persona_prompt: persona,
    live2d_model_name: skin,
    voice: voice || null,
    character_name: name,
    avatar: avatarFileName || "",
  };
  if (!editTarget && slug) body.slug = slug;

  try {
    $("#btnCharSave").disabled = true;
    if (editTarget) {
      await api("/api/characters/" + encodeURIComponent(editTarget.filename), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await api("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    toast(t("char.saved", { name }));
    closeCharModal();
    await loadCharacters();
    renderConnInfo();
  } catch (e2) {
    err.textContent = e2.message;
    err.hidden = false;
  } finally {
    $("#btnCharSave").disabled = false;
  }
});

/* ============================================================
   Backgrounds (images + animated wallpaper videos)
   ============================================================ */
const BG_VIDEO_RE = /\.(mp4|webm|mov)$/i;
const isVideoBg = (file) => !!file && BG_VIDEO_RE.test(file);

function applyBackground(file) {
  state.bgFile = file;
  store.set("bg", file);
  const bgEl = $("#sceneBgImg");
  const vidEl = $("#sceneBgVideo");
  if (!file) {
    bgEl.classList.remove("show");
    vidEl.pause();
    vidEl.classList.remove("show");
    vidEl.removeAttribute("src");
    vidEl.load();
  } else if (isVideoBg(file)) {
    bgEl.classList.remove("show");
    bgEl.style.backgroundImage = "";
    const src = `/bg/${encodeURIComponent(file)}`;
    if (vidEl.src !== location.origin + src) {
      vidEl.src = src;
      vidEl.load();
    }
    vidEl.play().catch(() => { /* autoplay may need a gesture; muted+playsinline usually fine */ });
    vidEl.classList.add("show");
    applyBackgroundSize();
  } else {
    vidEl.pause();
    vidEl.classList.remove("show");
    vidEl.removeAttribute("src");
    vidEl.load();
    bgEl.style.backgroundImage = `url("/bg/${encodeURIComponent(file)}")`;
    bgEl.classList.add("show");
    applyBackgroundSize();
  }
  renderBackgrounds(state.bgFiles || []);
}

/* Background fit: cover / contain / stretch / original, with a zoom multiplier.
   Sizes are computed in px from the image's natural size (or the video's
   videoWidth/videoHeight) so zoom works on every mode; cached per file and
   re-applied on window resize. */
const bgNaturalSizes = new Map(); // file -> {w, h} (0 until loaded)
function bgNaturalSize(file) {
  if (!bgNaturalSizes.has(file)) {
    const entry = { w: 0, h: 0 };
    bgNaturalSizes.set(file, entry);
    if (isVideoBg(file)) {
      const v = document.createElement("video");
      v.preload = "metadata"; v.muted = true;
      v.onloadedmetadata = () => { entry.w = v.videoWidth; entry.h = v.videoHeight; applyBackgroundSize(); };
      v.src = "/bg/" + encodeURIComponent(file);
    } else {
      const img = new Image();
      img.onload = () => { entry.w = img.naturalWidth; entry.h = img.naturalHeight; applyBackgroundSize(); };
      img.src = "/bg/" + encodeURIComponent(file);
    }
  }
  return bgNaturalSizes.get(file);
}

function applyBackgroundSize() {
  if (!state.bgFile) return;
  const { w, h } = bgNaturalSize(state.bgFile);
  if (!w || !h) return; // retry happens in the onload/loadedmetadata callback
  const vw = window.innerWidth, vh = window.innerHeight;
  const z = state.bgZoom || 1;
  let W, H;
  if (state.bgFit === "stretch") {
    W = vw * z; H = vh * z;
  } else {
    const base = state.bgFit === "cover" ? Math.max(vw / w, vh / h)
      : state.bgFit === "contain" ? Math.min(vw / w, vh / h)
      : 1; // original
    W = w * base * z; H = h * base * z;
  }
  if (isVideoBg(state.bgFile)) {
    const vidEl = $("#sceneBgVideo");
    vidEl.style.width = Math.round(W) + "px";
    vidEl.style.height = Math.round(H) + "px";
  } else {
    $("#sceneBgImg").style.backgroundSize = `${Math.round(W)}px ${Math.round(H)}px`;
  }
}

let bgFilesCache = [];
function renderBackgrounds(files) {
  bgFilesCache = files;
  state.bgFiles = files;
  const ul = $("#bgList");
  ul.innerHTML = "";
  const mkItem = (label, file, thumbUrl) => {
    const li = document.createElement("li");
    li.className = "bg-item-wrap";
    const btn = document.createElement("button");
    btn.className = "bg-item" + (state.bgFile === file ? " is-active" : "");
    const thumb = document.createElement("span");
    if (thumbUrl && isVideoBg(file)) {
      const v = document.createElement("video");
      v.className = "bg-item__thumb";
      v.preload = "metadata"; v.muted = true; v.playsInline = true;
      v.onerror = () => { v.replaceWith(Object.assign(document.createElement("span"), { className: "bg-item__thumb bg-item__thumb--none", textContent: "🎬" })); };
      v.src = thumbUrl;
      thumb.appendChild(v);
    } else if (thumbUrl) {
      const img = document.createElement("img");
      img.className = "bg-item__thumb";
      img.src = thumbUrl;
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
    } else {
      thumb.className = "bg-item__thumb bg-item__thumb--none";
      thumb.textContent = "🌸";
    }
    const nm = document.createElement("span");
    nm.className = "bg-item__name";
    nm.textContent = label;
    btn.append(thumb, nm);
    btn.addEventListener("click", () => applyBackground(file));
    li.appendChild(btn);
    if (file) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "bg-del";
      del.setAttribute("aria-label", t("bg.delete"));
      del.title = t("bg.delete");
      del.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-.8 12.1a2 2 0 0 1-2 1.9H8.8a2 2 0 0 1-2-1.9L6 7"/></svg>';
      del.addEventListener("click", (e) => { e.stopPropagation(); deleteBackground(file); });
      li.appendChild(del);
    }
    ul.appendChild(li);
  };
  mkItem(t("bg.none"), null, null);
  for (const f of files) mkItem(f, f, "/bg/" + encodeURIComponent(f));
}

async function deleteBackground(file) {
  if (!file) return;
  if (!confirm(t("bg.delete.confirm", { name: file }))) return;
  try {
    await api(`/api/background/${encodeURIComponent(file)}`, { method: "DELETE" });
    toast(t("bg.deleted"));
    bgNaturalSizes.delete(file);
    if (state.bgFile === file) applyBackground(null); // deleted file was on screen
    wsSend({ type: "fetch-backgrounds" });            // server list -> re-render picker
  } catch (e) {
    toast(t("bg.delete.failed"), true);
  }
}

$("#btnUploadBg").addEventListener("click", () => $("#bgFileInput").click());
/* XHR (not fetch) for the upload progress callback — 4K wallpapers can be
   hundreds of MB, so a live percentage in the toast matters. */
function uploadBackgroundFile(file) {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/background");
    xhr.responseType = "json";
    let lastPct = -1;
    xhr.upload.onprogress = (ev) => {
      if (!ev.lengthComputable) return;
      const p = Math.floor((ev.loaded / ev.total) * 100);
      if (p !== lastPct) { lastPct = p; toast(t("bg.upload.progress", { p })); }
    };
    xhr.onload = () => {
      const body = xhr.response;
      if (xhr.status >= 200 && xhr.status < 300 && body && body.ok) resolve(body);
      else reject(new Error((body && body.error) || xhr.statusText || "upload failed"));
    };
    xhr.onerror = () => reject(new Error("upload failed"));
    xhr.send(fd);
  });
}
$("#bgFileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  toast(t("bg.uploading"));
  try {
    const res = await uploadBackgroundFile(file);
    toast(t("bg.uploaded"));
    wsSend({ type: "fetch-backgrounds" });
    applyBackground(res.filename);
  } catch (err) {
    toast(err.message, true);
  }
});

/* ============================================================
   History
   ============================================================ */
function historyTime(h) {
  const uid = h.uid || "";
  const m = uid.match(/^(\d{4}-\d{2}-\d{2})_(\d{2})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]} ${m[2]}:${m[3]}`;
  return h.timestamp || "";
}

function renderHistoryList() {
  const ul = $("#historyList");
  ul.innerHTML = "";
  if (!state.histories.length) {
    const li = document.createElement("li");
    li.textContent = t("history.empty");
    li.style.cssText = "font-size:12.5px;color:var(--text-low);padding:8px 4px;";
    ul.appendChild(li);
    return;
  }
  for (const h of state.histories) {
    const li = document.createElement("li");
    li.className = "history-item" + (h.uid === state.historyUid ? " is-active" : "");
    const main = document.createElement("button");
    main.className = "history-item__main";
    const time = document.createElement("div");
    time.className = "history-item__time";
    time.textContent = historyTime(h);
    const preview = document.createElement("div");
    preview.className = "history-item__preview";
    const lm = h.latest_message || {};
    preview.textContent = (lm.role === "human" ? "🗣 " : "🌸 ") + (lm.content || "");
    main.append(time, preview);
    main.addEventListener("click", () => {
      wsSend({ type: "fetch-and-set-history", history_uid: h.uid });
      state.historyUid = h.uid;
      renderHistoryList();
    });
    const del = document.createElement("button");
    del.className = "history-item__del";
    del.setAttribute("aria-label", "delete");
    del.innerHTML = `<svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`;
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!confirm(t("confirm.delete.history"))) return;
      wsSend({ type: "delete-history", history_uid: h.uid });
    });
    li.append(main, del);
    ul.appendChild(li);
  }
}

function loadHistoryMessages(messages) {
  clearChat();
  for (const m of messages) {
    if (m.role === "human") addMsg("me", m.content || "");
    else if (m.role === "ai") addMsg("ai", m.content || "", { name: m.name });
    else if (m.role === "system") addSysMsg(m.content || "");
  }
  addSysMsg(t("history.loaded"));
  toast(t("history.loaded"));
}

$("#btnNewChat").addEventListener("click", () => {
  stopAllAudio();
  removeThinking();
  clearChat();
  state.historyUid = null;
  addSysMsg(t("welcome", { name: state.confName }));
  wsSend({ type: "create-new-history" });
  wsSend({ type: "fetch-history-list" });
});

/* ============================================================
   Group
   ============================================================ */
function renderGroup() {
  const note = $("#groupNote");
  const ul = $("#groupList");
  ul.innerHTML = "";
  if (!state.groupMembers.length) {
    note.textContent = t("group.none");
    return;
  }
  note.textContent = t("group.hint") + " " + state.clientUid;
  for (const uid of state.groupMembers) {
    const li = document.createElement("li");
    const dot = document.createElement("i");
    const span = document.createElement("span");
    span.textContent = uid === state.clientUid ? `${uid.slice(0, 8)}…（你${state.isGroupOwner ? " · 群主" : ""}）` : uid.slice(0, 12) + "…";
    li.append(dot, span);
    ul.appendChild(li);
  }
}

$("#btnGroupAdd").addEventListener("click", () => {
  const uid = $("#groupUidInput").value.trim();
  if (!uid) return;
  wsSend({ type: "add-client-to-group", invitee_uid: uid });
  $("#groupUidInput").value = "";
});
$("#btnGroupLeave").addEventListener("click", () => {
  wsSend({ type: "remove-client-from-group", target_uid: state.clientUid });
});

/* ============================================================
   LLM setup wizard (first-run "brain" setup)
   ============================================================ */
const OLLAMA_BASE_URL = "http://localhost:11434/v1";
const RECOMMENDED_OLLAMA_MODEL = "qwen2.5:3b";
const LLM_PROVIDERS = [
  { id: "openai", label: "OpenAI", model: "gpt-4o-mini" },
  { id: "claude", label: "Claude", model: "claude-sonnet-4-5" },
  { id: "gemini", label: "Gemini", model: "gemini-2.0-flash" },
  { id: "zhipu", label: "智谱", model: "glm-4-flash" },
  { id: "deepseek", label: "DeepSeek", model: "deepseek-chat" },
  { id: "groq", label: "Groq", model: "llama-3.1-8b-instant" },
  { id: "cerebras", label: "Cerebras", model: "llama-3.1-8b" },
  { id: "custom", label: "", model: "" }, // label comes from i18n (llm.provider.custom)
];

const llmWizard = {
  provider: "openai",
  ollama: null,          // last probe result {available, models, recommended}
  ollamaSelected: null,  // chosen local model name
  pulling: false,
  saving: false,
};

function llmStatusText(cfg) {
  return cfg.is_configured
    ? t("llm.status.configured", { model: cfg.model || cfg.provider })
    : t("llm.status.unconfigured");
}

function refreshLlmStatusNote() {
  if (state.llmCfg) $("#llmStatusNote").textContent = llmStatusText(state.llmCfg);
}

/* Boot-time: read config, update the settings-drawer note, and auto-open the
   wizard once per browser session when no usable brain is configured. */
async function initLlm() {
  let cfg = null;
  try { cfg = await api("/api/llm-config"); }
  catch {
    $("#llmStatusNote").textContent = t("llm.status.error");
    return;
  }
  state.llmCfg = cfg;
  $("#llmStatusNote").textContent = llmStatusText(cfg);
  loadLlmProfiles();
  if (cfg.is_configured === false) {
    try { if (!sessionStorage.getItem("hana.llmSkip")) openLlmWizard(); }
    catch { /* sessionStorage unavailable — just skip auto-open */ }
  }
}

function renderProviderChips() {
  const box = $("#providerChips");
  box.innerHTML = "";
  for (const p of LLM_PROVIDERS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "wizard__provider" + (p.id === llmWizard.provider ? " is-active" : "");
    chip.textContent = p.id === "custom" ? t("llm.provider.custom") : p.label;
    chip.addEventListener("click", () => {
      llmWizard.provider = p.id;
      if (p.model) $("#llmModel").value = p.model; // editable prefill, not a hidden placeholder
      $("#llmBaseUrlField").hidden = p.id !== "custom";
      $("#llmError").hidden = true;
      renderProviderChips();
    });
    box.appendChild(chip);
  }
  $("#llmBaseUrlField").hidden = llmWizard.provider !== "custom";
}

function renderOllamaSection() {
  const note = $("#ollamaStatus");
  const ul = $("#ollamaModelList");
  const s = llmWizard.ollama;
  if (!s || !s.available) {
    note.textContent = t("llm.ollama.off");
    $("#btnUseOllama").disabled = true;
    $("#btnOllamaPull").hidden = true;
    ul.innerHTML = "";
    return;
  }
  const models = s.models || [];
  if (!models.length) {
    note.textContent = t("llm.ollama.empty");
    $("#btnUseOllama").disabled = true;
    $("#btnOllamaPull").hidden = false;
    ul.innerHTML = "";
    return;
  }
  note.textContent = t("llm.ollama.ready", { n: models.length });
  $("#btnOllamaPull").hidden = models.includes(RECOMMENDED_OLLAMA_MODEL);
  ul.innerHTML = "";
  for (const m of models) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wizard__model" + (m === llmWizard.ollamaSelected ? " is-active" : "");
    btn.textContent = m;
    btn.addEventListener("click", () => {
      llmWizard.ollamaSelected = m;
      renderOllamaSection();
    });
    li.appendChild(btn);
    ul.appendChild(li);
  }
  $("#btnUseOllama").disabled = !llmWizard.ollamaSelected;
}

async function probeOllama() {
  $("#ollamaStatus").textContent = t("llm.ollama.checking");
  $("#btnUseOllama").disabled = true;
  let data = null;
  try { data = await api("/api/llm-config/ollama-models"); }
  catch { /* unreachable -> data stays null */ }
  llmWizard.ollama = data || { available: false, models: [] };
  const models = llmWizard.ollama.models || [];
  // keep the previous selection if still present; else prefer the recommended model
  const sel = models.includes(llmWizard.ollamaSelected)
    ? llmWizard.ollamaSelected
    : (models.includes(RECOMMENDED_OLLAMA_MODEL) ? RECOMMENDED_OLLAMA_MODEL : models[0] || null);
  llmWizard.ollamaSelected = sel;
  renderOllamaSection();
}

/* Stream POST /api/llm-config/ollama-pull (NDJSON) and render a progress bar.
   Ollama reports per-layer {digest, total, completed}; summing the layers gives
   a trustworthy overall percentage. */
async function pullOllamaModel() {
  if (llmWizard.pulling) return;
  llmWizard.pulling = true;
  const btn = $("#btnOllamaPull");
  const box = $("#ollamaPullBox");
  const bar = $("#ollamaPullBar");
  const pct = $("#ollamaPullPct");
  const errEl = $("#llmError");
  btn.disabled = true;
  errEl.hidden = true;
  box.hidden = false;
  bar.style.width = "0%";
  pct.textContent = "0%";
  const model = RECOMMENDED_OLLAMA_MODEL;
  try {
    const res = await fetch("/api/llm-config/ollama-pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    });
    if (!res.ok || !res.body) throw new Error("pull request failed");
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const layers = new Map(); // digest -> {completed, total}
    let buf = "";
    let succeeded = false;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.error) throw new Error(msg.error);
        if (msg.status === "success") succeeded = true;
        if (msg.digest && msg.total) {
          layers.set(msg.digest, { c: msg.completed || 0, t: msg.total || 0 });
          let c = 0, tot = 0;
          for (const l of layers.values()) { c += l.c; tot += l.t; }
          if (tot > 0) {
            const p = Math.min(100, Math.floor((c / tot) * 100));
            bar.style.width = p + "%";
            pct.textContent = p + "%";
          }
        }
      }
    }
    if (!succeeded) throw new Error("connection closed before completion");
    bar.style.width = "100%";
    pct.textContent = "100%";
    llmWizard.ollamaSelected = model;
    toast(t("llm.ollama.pull.done", { model }));
    await probeOllama();
    setTimeout(() => { box.hidden = true; }, 1200);
  } catch (err) {
    errEl.textContent = t("llm.ollama.pull.failed", { err: err.message });
    errEl.hidden = false;
  } finally {
    llmWizard.pulling = false;
    btn.disabled = false;
  }
}

/* POST /api/llm-config: backend validates with one cheap call, writes conf.yaml
   (comments preserved), and hot-applies to the running server. */
async function saveLlmConfig(provider, model, apiKey, baseUrl = "") {
  if (llmWizard.saving) return;
  const btn = provider === "ollama" ? $("#btnUseOllama") : $("#btnUseCloud");
  const errEl = $("#llmError");
  errEl.hidden = true;
  llmWizard.saving = true;
  const oldLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = t("llm.saving");
  try {
    await api("/api/llm-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, model, api_key: apiKey, base_url: baseUrl }),
    });
    toast(t("llm.saved"));
    closeLlmWizard();
    state.llmCfg = await api("/api/llm-config");
    $("#llmStatusNote").textContent = llmStatusText(state.llmCfg);
    loadLlmProfiles(); // the save just upserted a profile server-side
  } catch (e) {
    errEl.textContent = e.message;
    errEl.hidden = false;
  } finally {
    llmWizard.saving = false;
    btn.disabled = false;
    btn.textContent = oldLabel;
  }
}

async function useOllamaModel() {
  const model = llmWizard.ollamaSelected;
  if (!model) return;
  await saveLlmConfig("ollama", model, "ollama", OLLAMA_BASE_URL);
}

function cloudFormError(msg) {
  const err = $("#llmError");
  err.textContent = msg;
  err.hidden = false;
}

async function useCloudConfig() {
  const provider = llmWizard.provider;
  const model = $("#llmModel").value.trim();
  const key = $("#llmKey").value.trim();
  const baseUrl = provider === "custom" ? $("#llmBaseUrl").value.trim() : "";
  if (provider === "custom" && !baseUrl) return cloudFormError(t("llm.err.baseurl"));
  if (!model) return cloudFormError(t("llm.err.model"));
  if (!key) return cloudFormError(t("llm.err.key"));
  await saveLlmConfig(provider, model, key, baseUrl);
}

function openLlmWizard() {
  const cfg = state.llmCfg;
  // seed the model field with the saved cloud model (skip local ollama setups)
  if (cfg && cfg.model && cfg.base_url && !/11434|localhost|127\.0\.0\.1/.test(cfg.base_url)) {
    $("#llmModel").value = cfg.model;
  }
  $("#llmError").hidden = true;
  $("#ollamaPullBox").hidden = true;
  $("#ollamaPullBar").style.width = "0%";
  $("#ollamaPullPct").textContent = "0%";
  $("#llmModalBackdrop").hidden = false;
  requestAnimationFrame(() => $("#llmModalBackdrop").classList.add("show"));
  renderProviderChips();
  probeOllama();
}

function closeLlmWizard() {
  $("#llmModalBackdrop").classList.remove("show");
  setTimeout(() => ($("#llmModalBackdrop").hidden = true), 250);
}

$("#btnOpenLlm").addEventListener("click", () => { closeSettings(); openLlmWizard(); });
$("#btnLlmClose").addEventListener("click", closeLlmWizard);
$("#llmModalBackdrop").addEventListener("click", (e) => {
  if (e.target === $("#llmModalBackdrop")) closeLlmWizard();
});
$("#btnLlmSkip").addEventListener("click", () => {
  try { sessionStorage.setItem("hana.llmSkip", "1"); } catch { /* ignore */ }
  closeLlmWizard();
});
$("#btnOllamaRefresh").addEventListener("click", probeOllama);
$("#btnOllamaPull").addEventListener("click", pullOllamaModel);
$("#btnUseOllama").addEventListener("click", useOllamaModel);
$("#btnUseCloud").addEventListener("click", useCloudConfig);

/* ============================================================
   LLM quick switcher (saved profiles: chat chip + settings drawer)
   ============================================================ */
function providerLabel(id) {
  if (id === "custom") return t("llm.provider.custom");
  const p = LLM_PROVIDERS.find((x) => x.id === id);
  return p && p.label ? p.label : id;
}

/* A profile is "active" when its model+base_url match the running config —
   the backend has no active-marker field, this is display-only. */
function isActiveProfile(p) {
  const cfg = state.llmCfg;
  return !!cfg && cfg.is_configured === true && cfg.model === p.model &&
    (cfg.base_url || "") === (p.base_url || "");
}

function llmProfileItem(p) {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "llm-profile" + (isActiveProfile(p) ? " is-active" : "");
  const info = document.createElement("span");
  info.className = "llm-profile__info";
  const model = document.createElement("span");
  model.className = "llm-profile__model";
  model.textContent = p.model;
  const meta = document.createElement("span");
  meta.className = "llm-profile__meta";
  meta.textContent = providerLabel(p.provider) + " · " + (p.api_key_masked || "");
  info.append(model, meta);
  btn.appendChild(info);
  if (isActiveProfile(p)) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", "llm-profile__check");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", t("llm.profiles.active"));
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M5 13l4 4L19 7");
    svg.appendChild(path);
    btn.appendChild(svg);
    btn.setAttribute("aria-current", "true");
  }
  btn.addEventListener("click", () => activateLlmProfile(p.id));
  li.appendChild(btn);
  return li;
}

function llmProfileListEl(onReconfigure) {
  const frag = document.createDocumentFragment();
  const title = document.createElement("h3");
  title.className = "llm-profiles__title";
  title.textContent = t("llm.profiles.title");
  frag.appendChild(title);
  if (!state.llmProfiles.length) {
    const empty = document.createElement("p");
    empty.className = "llm-profiles__empty";
    empty.textContent = t("llm.profiles.empty");
    frag.appendChild(empty);
  } else {
    const ul = document.createElement("ul");
    ul.className = "llm-profiles__list";
    for (const p of state.llmProfiles) ul.appendChild(llmProfileItem(p));
    frag.appendChild(ul);
  }
  const re = document.createElement("button");
  re.type = "button";
  re.className = "btn btn--ghost llm-profiles__reconfig";
  re.textContent = t("llm.profiles.reconfigure");
  re.addEventListener("click", onReconfigure);
  frag.appendChild(re);
  return frag;
}

function renderLlmProfiles() {
  const drawerBox = $("#llmProfiles");
  if (drawerBox) {
    drawerBox.innerHTML = "";
    drawerBox.appendChild(llmProfileListEl(() => { closeSettings(); openLlmWizard(); }));
  }
  const pop = $("#chatModelPop");
  if (pop) {
    pop.innerHTML = "";
    pop.appendChild(llmProfileListEl(() => { closeChatModelPop(); openLlmWizard(); }));
  }
  renderChatModelChip();
}

function renderChatModelChip() {
  const btn = $("#btnChatModel");
  const nameEl = $("#chatModelName");
  if (!btn || !nameEl) return;
  const cfg = state.llmCfg;
  btn.title = t("llm.switch");
  nameEl.textContent = cfg && cfg.is_configured
    ? (cfg.model || t("llm.switch"))
    : t("llm.unconfigured");
}

async function loadLlmProfiles() {
  try {
    const res = await api("/api/llm-profiles");
    state.llmProfiles = res.profiles || [];
  } catch { state.llmProfiles = []; }
  renderLlmProfiles();
}

async function activateLlmProfile(id) {
  if (!id) return;
  toast(t("llm.switching"));
  try {
    const res = await api("/api/llm-profiles/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    state.llmCfg = {
      ...(state.llmCfg || {}),
      model: res.model,
      base_url: res.base_url,
      api_key_masked: res.api_key_masked,
      is_configured: true,
    };
    refreshLlmStatusNote();
    renderLlmProfiles();
    closeChatModelPop();
    toast(t("llm.switched", { model: res.model }));
  } catch (e) {
    toast(e.message || t("llm.switch.failed"), true);
  }
}

/* The popup lives at page level (NOT inside .chat, which is overflow:hidden on
   the narrow left panel and would clip it). Position it fixed under the chip,
   right-aligned to the chip and clamped into the viewport. */
function positionChatModelPop() {
  const pop = $("#chatModelPop");
  const btn = $("#btnChatModel");
  if (!pop || !btn) return;
  const r = btn.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(320, vw - 24);
  let left = r.right - width; // right-align to the chip
  if (left < 12) left = 12;
  if (left + width > vw - 12) left = Math.max(12, vw - 12 - width);
  pop.style.width = width + "px";
  pop.style.left = left + "px";
  const h = pop.offsetHeight || 0;
  let top = r.bottom + 10;
  if (top + h > vh - 12) top = Math.max(12, r.top - h - 10); // flip above if it would overflow
  pop.style.top = top + "px";
}

function openChatModelPop() {
  const pop = $("#chatModelPop");
  if (!pop || !pop.hidden) return;
  pop.hidden = false;
  positionChatModelPop();
  requestAnimationFrame(() => pop.classList.add("show"));
  $("#btnChatModel").setAttribute("aria-expanded", "true");
}
function closeChatModelPop() {
  const pop = $("#chatModelPop");
  if (!pop || pop.hidden) return;
  pop.classList.remove("show");
  $("#btnChatModel").setAttribute("aria-expanded", "false");
  setTimeout(() => (pop.hidden = true), 200);
}
$("#btnChatModel").addEventListener("click", () => {
  const pop = $("#chatModelPop");
  pop && pop.hidden ? openChatModelPop() : closeChatModelPop();
});
document.addEventListener("click", (e) => {
  const pop = $("#chatModelPop");
  if (pop && !pop.hidden && !e.target.closest("#chatModelWrap, #chatModelPop")) closeChatModelPop();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeChatModelPop();
});
window.addEventListener("resize", () => {
  const pop = $("#chatModelPop");
  if (pop && !pop.hidden) positionChatModelPop();
});

/* ============================================================
   Settings drawer
   ============================================================ */
function openSettings() {
  $("#drawerBackdrop").hidden = false;
  requestAnimationFrame(() => {
    $("#settingsDrawer").classList.add("show");
    $("#drawerBackdrop").classList.add("show");
  });
  $("#settingsDrawer").setAttribute("aria-hidden", "false");
}
function closeSettings() {
  $("#settingsDrawer").classList.remove("show");
  $("#drawerBackdrop").classList.remove("show");
  $("#settingsDrawer").setAttribute("aria-hidden", "true");
  setTimeout(() => ($("#drawerBackdrop").hidden = true), 300);
}
$("#btnSettings").addEventListener("click", () => {
  $("#settingsDrawer").classList.contains("show") ? closeSettings() : openSettings();
});
$("#btnDrawerClose").addEventListener("click", closeSettings);
$("#drawerBackdrop").addEventListener("click", closeSettings);

/* mute */
function setMute(on) {
  state.muted = on;
  store.set("mute", on);
  $("#btnMute").classList.toggle("is-on", on);
  $("#btnMute").setAttribute("aria-pressed", String(on));
  $("#setMute").checked = on;
  if (on) stopAllAudio();
}
$("#btnMute").addEventListener("click", () => setMute(!state.muted));
$("#setMute").addEventListener("change", (e) => setMute(e.target.checked));

$("#setSubtitle").addEventListener("change", (e) => {
  state.subtitleOn = e.target.checked;
  store.set("subtitle", state.subtitleOn);
  if (!state.subtitleOn) hideSubtitle();
});
$("#setPetals").addEventListener("change", (e) => {
  state.petalsOn = e.target.checked;
  store.set("petals", state.petalsOn);
  $("#petalField").style.display = state.petalsOn ? "" : "none";
});
$("#setEyes").addEventListener("change", (e) => {
  state.eyesOn = e.target.checked;
  store.set("eyes", state.eyesOn);
});
$("#bgFitSelect").addEventListener("change", (e) => {
  state.bgFit = e.target.value;
  store.set("bgFit", state.bgFit);
  applyBackgroundSize();
});
$("#bgZoom").addEventListener("input", (e) => {
  state.bgZoom = parseFloat(e.target.value);
  if (!isFinite(state.bgZoom)) state.bgZoom = 1;
  $("#bgZoomVal").textContent = Math.round(state.bgZoom * 100) + "%";
  store.set("bgZoom", state.bgZoom);
  applyBackgroundSize();
});

/* ---------------- quick adjust popup (size / position) ---------------- */
const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
function syncAdjustUI() {
  const pct = Math.round((state.modelScale || 1) * 100) + "%";
  $("#qaSize").value = state.modelScale;
  $("#qaSizeVal").textContent = pct;
  const x = Math.round((state.modelX || 0) * 100);
  const y = Math.round((state.modelY || 0) * 100);
  $("#qaX").value = x; $("#qaXVal").textContent = x;
  $("#qaY").value = y; $("#qaYVal").textContent = y;
}
function setAdjustOpen(on) {
  $("#adjustPop").hidden = !on;
  $("#dockAdjust").classList.toggle("is-active", on);
  $("#dockAdjust").setAttribute("aria-pressed", String(on));
  if (on) syncAdjustUI();
}
$("#dockAdjust").addEventListener("click", () => setAdjustOpen($("#adjustPop").hidden));
$("#btnAdjustClose").addEventListener("click", () => setAdjustOpen(false));
$("#btnAdjustReset").addEventListener("click", () => {
  state.modelScale = 1; state.modelX = 0; state.modelY = 0;
  store.set("modelScale", 1); store.set("modelX", 0); store.set("modelY", 0);
  syncAdjustUI();
  layoutModel();
});
$("#qaSize").addEventListener("input", (e) => {
  state.modelScale = clampN(parseFloat(e.target.value) || 1, 0.4, 2);
  store.set("modelScale", state.modelScale);
  syncAdjustUI();
  layoutModel();
});
$("#qaX").addEventListener("input", (e) => {
  state.modelX = clampN(parseFloat(e.target.value) / 100, -0.4, 0.4);
  store.set("modelX", state.modelX);
  syncAdjustUI();
  layoutModel();
});
$("#qaY").addEventListener("input", (e) => {
  state.modelY = clampN(parseFloat(e.target.value) / 100, -0.35, 0.35);
  store.set("modelY", state.modelY);
  syncAdjustUI();
  layoutModel();
});
document.addEventListener("pointerdown", (e) => {
  const pop = $("#adjustPop");
  if (!pop.hidden && !pop.contains(e.target) && !$("#dockAdjust").contains(e.target)) setAdjustOpen(false);
});

/* ---------------- drag the character / wheel-zoom while holding ---------------- */
let dragInfo = null; // {sx, sy, mx, my, moved}
let suppressHitUntil = 0;
const stageCanvas = $("#live2dCanvas");
stageCanvas.addEventListener("pointerdown", (e) => {
  if (!live2dModel || e.button !== 0) return;
  const b = live2dModel.getBounds();
  if (!b.contains(e.clientX, e.clientY)) return;
  dragInfo = { sx: e.clientX, sy: e.clientY, mx: state.modelX || 0, my: state.modelY || 0, moved: false };
  try { stageCanvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
});
stageCanvas.addEventListener("pointermove", (e) => {
  if (!dragInfo || !live2dModel) return;
  const dx = e.clientX - dragInfo.sx, dy = e.clientY - dragInfo.sy;
  if (Math.abs(dx) + Math.abs(dy) > 6) dragInfo.moved = true;
  state.modelX = clampN(dragInfo.mx + dx / window.innerWidth, -0.4, 0.4);
  state.modelY = clampN(dragInfo.my + dy / window.innerHeight, -0.35, 0.35);
  syncAdjustUI();
  layoutModel();
});
window.addEventListener("pointerup", () => {
  if (!dragInfo) return;
  if (dragInfo.moved) {
    store.set("modelX", state.modelX);
    store.set("modelY", state.modelY);
    suppressHitUntil = performance.now() + 250; // a drag is not a tap: no motion / name tag
  }
  dragInfo = null;
});
stageCanvas.addEventListener("wheel", (e) => {
  if (!dragInfo || !live2dModel) return; // zoom only while holding the character
  e.preventDefault();
  state.modelScale = clampN((state.modelScale || 1) * Math.exp(-e.deltaY * 0.0016), 0.4, 2);
  store.set("modelScale", state.modelScale);
  syncAdjustUI();
  layoutModel();
}, { passive: false });

/* ============================================================
   Panels / dock / tabs / chat collapse
   ============================================================ */
function switchTab(tab) {
  $$(".panel__tab").forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-selected", String(on));
  });
  ["Chars", "Bgs", "History"].forEach((id) => $("#tab" + id).classList.toggle("is-hidden", ("tab" + id).toLowerCase().slice(3) !== tab));
  if (state.mobile) $("#sidePanel").classList.add("is-open-mobile");
}
$$(".panel__tab").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

$("#dockChar").addEventListener("click", () => {
  if (state.mobile) {
    const p = $("#sidePanel");
    const open = p.classList.contains("is-open-mobile");
    p.classList.toggle("is-open-mobile", !open);
    if (!open) switchTab("chars");
  } else switchTab("chars");
});
$("#dockBg").addEventListener("click", () => {
  if (state.mobile) {
    const p = $("#sidePanel");
    const open = p.classList.contains("is-open-mobile");
    p.classList.toggle("is-open-mobile", !open);
    if (!open) switchTab("bgs");
  } else switchTab("bgs");
});
$("#dockChat").addEventListener("click", () => {
  const c = $("#chatPanel");
  if (state.mobile) c.classList.toggle("is-open-mobile");
  else {
    const collapsed = c.classList.contains("is-collapsed");
    c.classList.toggle("is-collapsed", !collapsed);
    $("#btnChatCollapse").setAttribute("aria-expanded", String(collapsed));
  }
});

$("#btnChatCollapse").addEventListener("click", () => {
  const c = $("#chatPanel");
  const collapsed = c.classList.contains("is-collapsed");
  c.classList.toggle("is-collapsed", !collapsed);
  $("#btnChatCollapse").setAttribute("aria-expanded", String(collapsed));
});

/* topbar collapse: slide the bar up, keep a floating restore pill; chat/panel
   glide up via body.topbar-collapsed. Preference persists. */
function setTopbarCollapsed(v) {
  document.body.classList.toggle("topbar-collapsed", v);
  $("#btnTopbarRestore").hidden = !v;
  $("#btnTopbarCollapse").setAttribute("aria-expanded", String(!v));
  store.set("topbarCollapsed", v);
}
$("#btnTopbarCollapse").addEventListener("click", () => setTopbarCollapsed(true));
$("#btnTopbarRestore").addEventListener("click", () => setTopbarCollapsed(false));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSettings();
    closeCharModal();
    closeLlmWizard();
  }
});

/* ============================================================
   i18n apply & language switch
   ============================================================ */
function applyI18n() {
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  $("#chatText").placeholder = t("chat.placeholder");
  $("#bootText").textContent = t("boot");
  $("#micHint").textContent = t("chat.hint");
  document.documentElement.lang = LANG_TAGS[lang] || lang;
  document.title = LANG_TITLES[lang] || "Hana-Companion · Sakura Stage";
  // voice options carry locale/gender text — rebuild when language changes
  if (!$("#charModalBackdrop").hidden) {
    fillVoiceSelect(editTarget?.voice || "", $("#fVoiceFilter").value);
  }
  // LLM wizard dynamic parts follow the language too
  refreshLlmStatusNote();
  renderLlmProfiles();
  if (!$("#llmModalBackdrop").hidden) {
    renderProviderChips();
    renderOllamaSection();
  }
  renderGroup();
  renderHistoryList();
}

function initLangSwitch() {
  $$(".lang-switch__btn").forEach((b) => {
    const on = b.dataset.lang === lang;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-pressed", String(on));
    b.addEventListener("click", () => {
      lang = b.dataset.lang;
      store.set("lang", lang);
      $$(".lang-switch__btn").forEach((x) => {
        const active = x === b;
        x.classList.toggle("is-active", active);
        x.setAttribute("aria-pressed", String(active));
      });
      applyI18n();
    });
  });
}

/* ============================================================
   Petals
   ============================================================ */
function spawnPetals(count = 22) {
  const field = $("#petalField");
  if (!field || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  field.innerHTML = "";
  const cols = ["#ffb3d1", "#ff9cc0", "#ffc9de", "#ff8fb8"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "petal";
    const s = 9 + Math.random() * 12;
    p.style.setProperty("--c", cols[i % cols.length]);
    p.style.setProperty("--s", s + "px");
    p.style.setProperty("--sway", (Math.random() * 160 - 80).toFixed(0) + "px");
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + "s";
    p.style.animationDelay = (Math.random() * -12).toFixed(1) + "s";
    p.style.opacity = (0.5 + Math.random() * 0.45).toFixed(2);
    field.appendChild(p);
  }
}

/* ============================================================
   Boot
   ============================================================ */
let bootHidden = false;
function hideBoot() {
  if (bootHidden) return;
  bootHidden = true;
  const boot = $("#boot");
  boot.classList.add("is-done");
  setTimeout(() => boot.setAttribute("hidden", ""), 700);
}

/* ============================================================
   Init
   ============================================================ */
async function init() {
  applyI18n();
  initLangSwitch();
  spawnPetals();
  if (!state.petalsOn) $("#petalField").style.display = "none";
  setMute(state.muted);
  $("#setSubtitle").checked = state.subtitleOn;
  $("#setPetals").checked = state.petalsOn;
  $("#setEyes").checked = state.eyesOn;
  $("#bgFitSelect").value = state.bgFit;
  $("#bgZoom").value = state.bgZoom;
  $("#bgZoomVal").textContent = Math.round(state.bgZoom * 100) + "%";
  if (store.get("topbarCollapsed", false)) setTopbarCollapsed(true);
  if (state.bgFile) applyBackground(state.bgFile);
  if (state.mobile) $("#sidePanel").classList.remove("is-open-mobile");

  await initPixi();
  connectWS();
  loadCharacters();
  initLlm();
  setTimeout(hideBoot, 4000); // safety: never trap user on boot screen
  setTimeout(() => toast(t("toast.ready")), 1200);
  if (state.mobile) {
    $("#chatPanel").classList.remove("is-collapsed");
  }
}

window.addEventListener("beforeunload", () => { try { ws && ws.close(); } catch { /* ignore */ } });

init();

// debug handle for development
window.__hana = {
  state,
  get pixiApp() { return pixiApp; },
  get live2dModel() { return live2dModel; },
  layoutModel,
};
