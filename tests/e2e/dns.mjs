// Test DNS server: answers A and TXT queries from records.json, which tests edit live.
import dns2 from "dns2";
import { readFileSync } from "node:fs";
const { Packet } = dns2;
const file = new URL("./records.json", import.meta.url);
const server = dns2.createServer({
  udp: true,
  handle: (request, send) => {
    const response = Packet.createResponseFromRequest(request);
    const [question] = request.questions;
    let records = {};
    try { records = JSON.parse(readFileSync(file, "utf8")); } catch {}
    const name = question.name.toLowerCase();
    if (question.type === Packet.TYPE.A && records.A?.[name]) response.answers.push({ name: question.name, type: Packet.TYPE.A, class: Packet.CLASS.IN, ttl: 1, address: records.A[name] });
    if (question.type === Packet.TYPE.TXT && records.TXT?.[name]) response.answers.push({ name: question.name, type: Packet.TYPE.TXT, class: Packet.CLASS.IN, ttl: 1, data: records.TXT[name] });
    send(response);
  },
});
server.listen({ udp: { port: 5353, address: "127.0.0.1" } }).then(() => console.log("dns on 5353"));
