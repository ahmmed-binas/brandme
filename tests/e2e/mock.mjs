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
    if (typeof body.system === "string" && body.system.includes("You are the Investigator")) {
      const prompt = String(body.messages[0].content);
      log.push(`INVESTIGATOR tools=${body.tools?.map((tool) => tool.type).join(",")}`);
      log.push(`INVESTIGATOR already-read=${prompt.includes("Already read")} spa-text=${prompt.includes("Lagos and Dubai")}`);
      const urls = [...prompt.matchAll(/: (https?:\/\/\S+)/g)].map((match) => match[1]);
      const result = {
        findings: [
          { kind: "role", title: "Head of Platform", detail: "Leads the platform group of 40 engineers.", year: "2026", organisation: "Northwind Pay", source_url: "http://localhost:4010/news/northwind", confidence: "high" },
          { kind: "highlight", title: "Speaker at DevConf Dubai 2026", detail: "Talk on calm on-call rotations", year: "2026", organisation: "DevConf Dubai", source_url: "http://localhost:4010/news/devconf", confidence: "medium" },
          // Confident, but the cited page is about another Ada: the check must drop it.
          { kind: "highlight", title: "Keynote at RustConf 2026", detail: "Opening keynote", year: "2026", organisation: "RustConf", source_url: "http://localhost:4010/news/other-ada", confidence: "high" },
          // Confident, but years old: dropped as old news.
          { kind: "highlight", title: "Engineering Excellence Award", detail: "Company award", year: "2019", organisation: "Northwind Pay", source_url: "http://localhost:4010/news/northwind", confidence: "high" },
          // Confident, but its page can't be read: kept, waits for the owner.
          { kind: "highlight", title: "Interview in Platform Weekly", detail: "On calm on-call", year: "2026", organisation: "Platform Weekly", source_url: "http://localhost:4010/news/missing", confidence: "high" },
          { kind: "highlight", title: "A different person entirely", detail: "same name", year: "2026", organisation: "", source_url: "https://example.org/someone-else", confidence: "low" },
        ],
        sources: urls.map((url) => ({ url, status: /linkedin|instagram/.test(url) ? "partly" : "read", note: /linkedin|instagram/.test(url) ? "Only the name and headline are visible without logging in" : "" })),
      };
      return send(res, 200, { id: "msg_i", type: "message", role: "assistant", model: body.model, stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 12000, output_tokens: 1800, server_tool_use: { web_search_requests: 3, web_fetch_requests: urls.length } }, content: [{ type: "text", text: JSON.stringify(result) }] });
    }
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

  // News pages the Investigator's findings cite (it reads them to check each finding).
  const NEWS = {
    "/news/northwind": "<h1>Northwind Pay appoints Ada Okafor as Head of Platform</h1><p>Ada Okafor will lead the platform group of 40 engineers at Northwind Pay.</p>",
    "/news/devconf": "<h1>DevConf Dubai 2026 speakers</h1><ul><li>Ada Okafor: calm on-call rotations</li><li>Sam Lee: queues</li></ul>",
    "/news/other-ada": "<h1>RustConf 2026 keynote</h1><p>Ada Smith, a compiler engineer from Lisbon, opens RustConf this year.</p>",
  };
  if (NEWS[path]) { res.writeHead(200, { "Content-Type": "text/html" }); return res.end(`<!doctype html><html><head><title>News</title></head><body>${NEWS[path]}</body></html>`); }
  // A portfolio page that only shows its content once JavaScript runs (like many site builders).
  if (path === "/spa/ada") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(`<!doctype html><html><head><title>Loading…</title></head><body><div id="app"></div><script>
      document.title = "Ada Okafor";
      document.getElementById("app").innerHTML = "<h1>Ada Okafor</h1><p>Staff Engineer at Northwind Pay, based in Lagos and Dubai.</p>";
      const ld = document.createElement("script"); ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Person", name: "Ada Okafor", jobTitle: "Staff Engineer", worksFor: { "@type": "Organization", name: "Northwind Pay" } });
      document.head.appendChild(ld);
    </script></body></html>`);
  }

  // A public RSS feed for the Investigator tests (two recent posts, one old one).
  if (path === "/feeds/demo.xml") {
    const day = 86400000;
    const items = [[2, "Why calm on-call wins"], [9, "Indexes you forgot you needed"], [900, "An old post from years ago"]];
    res.writeHead(200, { "Content-Type": "application/rss+xml" });
    return res.end(`<?xml version="1.0"?><rss version="2.0"><channel><title>Demo blog</title>${items.map(([ago, title]) => `<item><title><![CDATA[${title}]]></title><link>https://blog.example.org/${encodeURIComponent(title)}</link><pubDate>${new Date(Date.now() - ago * day).toUTCString()}</pubDate><description>&lt;p&gt;${title} &amp;amp; more&lt;/p&gt;</description></item>`).join("")}</channel></rss>`);
  }

  // Stripe
  if (path === "/v1/checkout/sessions" && req.method === "POST") {
    const params = new URLSearchParams(raw);
    log.push(`CHECKOUT amount=${params.get("line_items[0][price_data][unit_amount]")} order=${params.get("metadata[orderId]") ?? params.get("metadata[billingOrderId]")} kind=${params.get("metadata[kind]")} save=${params.get("payment_intent_data[setup_future_usage]")} name=${params.get("line_items[0][price_data][product_data][name]")} fee=${params.get("line_items[1][price_data][unit_amount]")}`);
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
