// Minimal SMTP server that accepts AUTH PLAIN/LOGIN and writes each message to a file.
import net from "node:net";
import fs from "node:fs";
let count = 0;
net.createServer((socket) => {
  let data = false, buffer = "", message = "";
  const say = (line) => socket.write(line + "\r\n");
  say("220 sink ESMTP");
  socket.on("data", (chunk) => {
    buffer += chunk.toString();
    let index;
    while ((index = buffer.indexOf("\r\n")) >= 0) {
      const line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
      if (data) { if (line === ".") { data = false; fs.writeFileSync(`${process.argv[2]}/mail-${++count}.eml`, message); message = ""; say("250 OK queued"); } else message += line + "\n"; continue; }
      const verb = line.split(" ")[0].toUpperCase();
      if (verb === "EHLO") { socket.write("250-sink\r\n250-AUTH PLAIN LOGIN\r\n250 OK\r\n"); }
      else if (verb === "AUTH") say("235 Authentication successful");
      else if (verb === "DATA") { data = true; say("354 End with ."); }
      else if (verb === "QUIT") { say("221 Bye"); socket.end(); }
      else say("250 OK");
    }
  });
}).listen(2525, () => console.log("smtp sink on 2525"));
