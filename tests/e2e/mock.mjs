// Stand-in for GitHub, Vercel and Stripe APIs during local tests. Logs every call.
import http from "node:http";

const configured = new Set();
const projectDomains = new Map();
const orders = new Map();
const log = [];

const send = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };

http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  const url = new URL(req.url, "http://mock");
  const path = url.pathname;
  log.push(`${req.method} ${path}`);
  let m;

  // Test controls
  if (path === "/__log") return send(res, 200, log);
  if (path === "/__configure") { configured.add(url.searchParams.get("domain")); return send(res, 200, { ok: true }); }

  // GitHub
  if ((m = path.match(/^\/users\/([^/]+)$/))) {
    if (m[1] === "nobody") return send(res, 404, { message: "Not Found" });
    return send(res, 200, { login: m[1], name: "Ada Lovelace", bio: "I write programs for engines that don't exist yet.", blog: "", location: "London", email: null, html_url: `https://github.com/${m[1]}`, twitter_username: null });
  }
  if ((m = path.match(/^\/users\/([^/]+)\/repos$/))) {
    const now = new Date().toISOString();
    return send(res, 200, [
      { name: "analytical-engine", description: "Notes and programs for the Analytical Engine.", html_url: "https://github.com/x/analytical-engine", homepage: "https://engine.example", language: "Python", topics: ["math", "computing"], stargazers_count: 120, fork: false, archived: false, pushed_at: now },
      { name: "bernoulli", description: "Computes Bernoulli numbers.", html_url: "https://github.com/x/bernoulli", homepage: null, language: "TypeScript", topics: [], stargazers_count: 40, fork: false, archived: false, pushed_at: now },
      { name: "someone-elses-lib", description: "fork", html_url: "https://github.com/x/fork", homepage: null, language: "Go", topics: [], stargazers_count: 999, fork: true, archived: false, pushed_at: now },
    ]);
  }

  // Vercel registrar
  if (path === "/v1/registrar/domains/availability" && req.method === "POST") {
    const { domains } = JSON.parse(raw);
    return send(res, 200, { results: domains.map((domain) => ({ domain, available: !domain.endsWith(".com") || domain.startsWith("fail") || domain.startsWith("ada") })) });
  }
  if ((m = path.match(/^\/v1\/registrar\/domains\/([^/]+)\/price$/))) return send(res, 200, { years: 1, purchasePrice: 12, renewalPrice: 14, transferPrice: 12 });
  if ((m = path.match(/^\/v1\/registrar\/domains\/([^/]+)\/renew$/)) && req.method === "POST") {
    log.push(`RENEW ${m[1]} ${raw}`);
    if (m[1].startsWith("norenew")) return send(res, 400, { error: { code: "renew_failed", message: "Renewal not allowed." } });
    return send(res, 200, { orderId: `renew_${Date.now()}` });
  }
  if ((m = path.match(/^\/v1\/registrar\/domains\/([^/]+)\/buy$/))) {
    const body = JSON.parse(raw);
    log.push(`BUY ${m[1]} expectedPrice=${body.expectedPrice} autoRenew=${body.autoRenew} phone=${body.contactInformation?.phone} country=${body.contactInformation?.country}`);
    if (m[1].startsWith("fail")) return send(res, 400, { error: { code: "purchase_failed", message: "Registry rejected the registration." } });
    const id = `ord_${orders.size + 1}`;
    orders.set(id, { domain: m[1], polls: 0 });
    return send(res, 200, { orderId: id });
  }
  if ((m = path.match(/^\/v1\/registrar\/orders\/([^/]+)$/))) {
    const order = orders.get(m[1]);
    order.polls += 1;
    return send(res, 200, { orderId: m[1], status: order.polls > 1 ? "completed" : "pending", domains: [{ domainName: order.domain, status: order.polls > 1 ? "completed" : "pending" }] });
  }

  // Vercel DNS records for bought domains
  if ((m = path.match(/^\/v2\/domains\/([^/]+)\/records$/)) && req.method === "POST") {
    const body = JSON.parse(raw);
    log.push(`DNS ${decodeURIComponent(m[1])} ${body.type} ${body.name || "@"} ${body.value}`);
    return send(res, 200, { uid: "rec_1" });
  }

  // Vercel project domains
  if ((m = path.match(/^\/v10\/projects\/[^/]+\/domains$/)) && req.method === "POST") {
    const { name } = JSON.parse(raw);
    const record = { name, verified: !name.includes("needs-txt"), verification: name.includes("needs-txt") ? [{ type: "TXT", domain: `_vercel.${name}`, value: "vc-domain-verify=abc123", reason: "pending_domain_verification" }] : [] };
    projectDomains.set(name, record);
    return send(res, 200, record);
  }
  if ((m = path.match(/^\/v9\/projects\/[^/]+\/domains\/([^/]+)(\/verify)?$/))) {
    const name = decodeURIComponent(m[1]);
    if (req.method === "DELETE") { projectDomains.delete(name); return send(res, 200, {}); }
    const record = projectDomains.get(name);
    if (!record) return send(res, 404, { error: { code: "not_found", message: "Domain not found" } });
    if (m[2] && configured.has(name)) record.verified = true;
    return send(res, 200, record);
  }
  if ((m = path.match(/^\/v6\/domains\/([^/]+)\/config$/))) return send(res, 200, { misconfigured: !configured.has(decodeURIComponent(m[1])) });

  // Anthropic models list (used to verify customers' own keys)
  if (path === "/v1/models" && req.method === "GET") {
    const key = req.headers["x-api-key"];
    log.push(`MODELS key=${key}`);
    if (key !== "sk-ant-api03-validkeyvalidkeyvalidkey") return send(res, 401, { type: "error", error: { type: "authentication_error", message: "invalid x-api-key" } });
    return send(res, 200, { data: [{ id: "claude-opus-5-5", type: "model" }], has_more: false });
  }

  // Anthropic Messages API
  if (path === "/v1/messages" && req.method === "POST") {
    const body = JSON.parse(raw);
    log.push(`CLAUDE-KEY ${req.headers["x-api-key"]}`);
    if (typeof body.system === "string" && body.system.includes("research a person")) {
      log.push(`RESEARCH tools=${body.tools?.map((tool) => tool.type).join(",")}`);
      const findings = { findings: [
        { kind: "highlight", title: "Talk at PGConf EU: Indexes you forgot you needed (2026)", detail: "Keynote on Postgres indexing", year: "2026", organisation: "PGConf EU", source_url: "https://example.org/pgconf-2026", confidence: "high" },
        { kind: "role", title: "Principal Engineer", detail: "Promoted to lead the infrastructure group.", year: "2026", organisation: "Northwind Pay", source_url: "https://example.org/northwind-news", confidence: "high" },
        { kind: "highlight", title: "Someone else with the same name", detail: "unrelated", year: "2026", organisation: "", source_url: "https://example.org/other", confidence: "low" },
      ] };
      return send(res, 200, { id: "msg_r", type: "message", role: "assistant", model: body.model, stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 9000, output_tokens: 1500, server_tool_use: { web_search_requests: 4 } }, content: [{ type: "text", text: "Here is what I found: " + JSON.stringify(findings) }] });
    }
    log.push(`CLAUDE model=${body.model} fallbacks=${body.fallbacks} beta=${req.headers["anthropic-beta"]} effort=${body.output_config?.effort} format=${body.output_config?.format?.type}`);
    const message = (text) => send(res, 200, { id: "msg_1", type: "message", role: "assistant", model: body.model, stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 }, content: [{ type: "text", text: JSON.stringify(text) }] });
    if (body.system.includes("raw information")) {
      const source = body.messages[0].content;
      return message({ name: "Grace Hopper", professional_title: "Computer Scientist", tagline: "I make computers speak human languages.", location: "Arlington", email: "", github: "", linkedin: "javascript:alert(1)", summary: ["I built the first compiler."], skills: ["COBOL", "Compilers"], projects: [{ title: "A-0 System", description: "An early compiler.", technologies: ["Assembly"], live_url: "", github: "" }], experience: [{ job_title: "Rear Admiral", company: "US Navy", location: "", start_date: "1943", end_date: "1986", description: source.includes("Navy") ? "Led programming teams." : "", technologies: [] }] });
    }
    const fields = JSON.parse(body.messages[0].content.split("\n")[1]);
    const title = fields.find((field) => field.path === "professional_title");
    return message({ reply: "Tightened your title.", changes: [{ path: title.path, value: "Computer Scientist" }, { path: "name", value: "Hacked Name" }, { path: "github", value: "javascript:alert(1)" }] });
  }

  // Stripe
  if (path === "/v1/checkout/sessions" && req.method === "POST") {
    const params = new URLSearchParams(raw);
    log.push(`CHECKOUT amount=${params.get("line_items[0][price_data][unit_amount]")} order=${params.get("metadata[orderId]") ?? params.get("metadata[billingOrderId]")} kind=${params.get("metadata[kind]")} save=${params.get("payment_intent_data[setup_future_usage]")} name=${params.get("line_items[0][price_data][product_data][name]")}`);
    return send(res, 200, { id: `cs_test_${Date.now()}`, object: "checkout.session", url: "http://localhost:3100/fake-stripe-checkout" });
  }
  if (path === "/v1/customers" && req.method === "POST") { log.push("CUSTOMER"); return send(res, 200, { id: `cus_${Date.now()}`, object: "customer" }); }
  if ((m = path.match(/^\/v1\/payment_intents\/([^/]+)$/)) && req.method === "GET") return send(res, 200, { id: m[1], object: "payment_intent", status: "succeeded", payment_method: url.searchParams.get("decline") ? "pm_decline" : "pm_card_visa" });
  if (path === "/v1/payment_intents" && req.method === "POST") {
    const params = new URLSearchParams(raw);
    log.push(`CHARGE amount=${params.get("amount")} pm=${params.get("payment_method")} off_session=${params.get("off_session")} key=${req.headers["idempotency-key"]}`);
    if (params.get("payment_method") === "pm_decline") return send(res, 402, { error: { type: "card_error", code: "card_declined", message: "Your card was declined." } });
    return send(res, 200, { id: `pi_renew_${Date.now()}`, object: "payment_intent", status: "succeeded" });
  }
  if (path === "/v1/refunds" && req.method === "POST") { log.push(`REFUND ${new URLSearchParams(raw).get("payment_intent")}`); return send(res, 200, { id: "re_1", object: "refund" }); }

  send(res, 404, { error: { message: `mock: no route for ${req.method} ${path}` } });
}).listen(4010, () => console.log("mock listening on 4010"));
