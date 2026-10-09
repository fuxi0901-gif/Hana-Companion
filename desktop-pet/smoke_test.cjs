// Zero-dependency protocol smoke test: minimal WS client over node:http.
const http = require("http");
const crypto = require("crypto");

const KEY = crypto.randomBytes(16).toString("base64");
const req = http.request({
  host: "127.0.0.1", port: 12393, path: "/client-ws",
  headers: { Connection: "Upgrade", Upgrade: "websocket", "Sec-WebSocket-Key": KEY, "Sec-WebSocket-Version": "13" },
});
req.on("upgrade", (res, socket) => {
  if (res.statusCode !== 101) { console.log("upgrade failed", res.statusCode); process.exit(1); }
  start(socket);
});
req.on("error", (e) => { console.log("conn error", e.message); process.exit(1); });
req.end();

function send(socket, str) {
  const payload = Buffer.from(str);
  const mask = crypto.randomBytes(4);
  let header;
  if (payload.length < 126) {
    header = Buffer.from([0x81, 0x80 | payload.length]);
  } else {
    header = Buffer.alloc(4);
    header[0] = 0x81; header[1] = 0x80 | 126; header.writeUInt16BE(payload.length, 2);
  }
  const masked = Buffer.from(payload);
  for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
  socket.write(Buffer.concat([header, mask, masked]));
}

let buf = Buffer.alloc(0);
let types = [], heard = {}, done = false;
const finish = (ok, why) => {
  if (done) return; done = true;
  console.log(JSON.stringify({ ok, why, types }, null, 1));
  process.exit(ok ? 0 : 1);
};
setTimeout(() => finish(false, "timeout"), 90000);

function start(socket) {
  setTimeout(() => send(socket, JSON.stringify({ type: "text-input", text: "你好，请用一句话介绍你自己" })), 1500);
  socket.on("data", (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      if (buf.length < 2) return;
      const len0 = buf[1] & 0x7f;
      let off = 2, len = len0;
      if (len0 === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len0 === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (buf.length < off + len) return;
      const body = buf.subarray(off, off + len).toString();
      buf = buf.subarray(off + len);
      let p; try { p = JSON.parse(body); } catch { continue; }
      types.push(p.type + (p.type === "control" ? ":" + p.text : ""));
      if (p.type === "set-model-and-conf")
        console.log("model:", p.model_info && p.model_info.name, "| conf:", p.conf_name, "| uid:", p.client_uid && p.client_uid.slice(0, 8));
      if (p.type === "audio")
        console.log("audio: hasAudio=", !!p.audio, "b64len=", p.audio ? p.audio.length : 0, "volumes=", (p.volumes || []).length, "slice=", p.slice_length, "text=", JSON.stringify((p.display_text || {}).text || "").slice(0, 60), "actions=", JSON.stringify(p.actions || null));
      if (p.type === "error") finish(false, "server error: " + p.message);
      if (p.type === "audio") heard.audio = true;
      if (p.type === "backend-synth-complete" && heard.audio && !heard.ack) {
        heard.ack = true;
        send(socket, JSON.stringify({ type: "frontend-playback-complete" }));
      }
      if (p.type === "control" && p.text === "conversation-chain-end" && heard.audio) {
        finish(true, "chain complete");
      }
    }
  });
  socket.on("error", () => {});
}
