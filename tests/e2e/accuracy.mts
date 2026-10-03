// Accuracy checks for imports and the Investigator's fact-checking, over several fixtures.
// Run: npx tsx tests/e2e/accuracy.mts   (no server needed; prints • lines, then a pass count)
import { zipSync, strToU8 } from "fflate";
const { groundProfile } = await import("../../lib/import/grounding.ts");
const { readLinkedInExport, linkedInDate } = await import("../../lib/import/linkedin-export.ts");
const { mentionsPerson, mentionsClaim } = await import("../../lib/investigator/verify.ts");
const { readHtml, peopleFromJsonLd } = await import("../../lib/investigator/reader.ts");

let passed = 0, failed = 0;
const check = (label: string, ok: boolean, detail = "") => { ok ? passed++ : failed++; console.log(`• ${ok ? "ok  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`); };

// 1) CV import: things the AI made up are removed; real facts stay. Three different CVs.
const cvs = [
  {
    cv: "Ada Okafor — Staff Engineer\nLagos · ada@okafor.dev · github.com/adaokafor\nExperience\nNorthwind Pay, Staff Engineer, Mar 2021 – Present. Led payments platform.\nPaystack, Senior Software Engineer, 2017 – 2021.\nEducation: University of Lagos, BSc Computer Science, 2013–2017\nSkills: Go, PostgreSQL, Kubernetes\nAWS Certified Solutions Architect (2022)",
    ai: { name: "Ada Okafor", email: "ada@okafor.dev", github: "https://github.com/adaokafor", linkedin: "https://linkedin.com/in/ada-okafor", location: "Lagos",
      skills: ["Go", "PostgreSQL", "Kubernetes", "Rust"],
      experience: [{ job_title: "Staff Engineer", company: "Northwind Pay", start_date: "Mar 2021", end_date: "Present" }, { job_title: "Sr. Software Engineer", company: "Paystack", start_date: "2017", end_date: "2021" }, { job_title: "Engineer", company: "Google", start_date: "2015", end_date: "2017" }],
      education: [{ school: "University of Lagos", degree: "BSc Computer Science", start_date: "2013", end_date: "2017" }, { school: "MIT", degree: "MSc", start_date: "", end_date: "" }],
      highlights: [{ title: "AWS Certified Solutions Architect", detail: "", year: "2022", url: "" }, { title: "Forbes 30 Under 30", detail: "", year: "2020", url: "" }] },
    keep: ["Northwind Pay", "Paystack", "University of Lagos", "AWS Certified", "Go", "ada@okafor.dev", "github.com/adaokafor"],
    drop: ["Google", "MIT", "Forbes", "Rust", "linkedin.com/in/ada-okafor"],
  },
  {
    cv: "Mohammed Rahman\nReal estate agent, Dubai Marina. RERA licensed. Joined Allsopp & Allsopp in 2020. Previously Betterhomes (2016–2020). Top performer award 2023. Arabic, English. www.mohammed-homes.ae",
    ai: { name: "Mohammed Rahman", skills: ["Arabic", "English", "Negotiation"], experience: [{ job_title: "Real Estate Agent", company: "Allsopp and Allsopp", start_date: "2020", end_date: "Present" }, { job_title: "Agent", company: "Betterhomes", start_date: "2016", end_date: "2020" }, { job_title: "Agent", company: "Emaar", start_date: "2014", end_date: "2016" }],
      highlights: [{ title: "Top performer award", detail: "", year: "2023", url: "" }], links: [{ label: "Website", url: "https://www.mohammed-homes.ae" }, { label: "Instagram", url: "https://instagram.com/mo.homes" }] },
    keep: ["Allsopp", "Betterhomes", "Top performer", "mohammed-homes.ae", "Arabic"],
    drop: ["Emaar", "Negotiation", "instagram.com/mo.homes"],
  },
  {
    cv: "Chef Sara Lind. Head chef at Fäviken 2019-2023, sous chef at Noma (2015).\nCookbook: Northern Fire (2024).",
    ai: { name: "Sara Lind", experience: [{ job_title: "Head Chef", company: "Faviken", start_date: "2019", end_date: "2023" }, { job_title: "Sous Chef", company: "Noma", start_date: "2015", end_date: "2018" }], highlights: [{ title: "Northern Fire (cookbook)", detail: "", year: "2024", url: "" }, { title: "Michelin star", detail: "", year: "2021", url: "" }] },
    keep: ["Faviken", "Noma", "Northern Fire"],
    drop: ["Michelin", "end 2018"],
  },
];
for (const [i, fixture] of cvs.entries()) {
  const { profile, removed } = groundProfile(fixture.ai as never, fixture.cv);
  const flat = JSON.stringify(profile);
  for (const keep of fixture.keep) check(`CV ${i + 1}: keeps ${keep}`, flat.includes(keep));
  for (const drop of fixture.drop) {
    if (drop === "end 2018") check(`CV ${i + 1}: drops an invented end year`, profile.experience?.find((item) => item.company === "Noma")?.end_date === "");
    else check(`CV ${i + 1}: drops ${drop}`, !flat.includes(drop), removed.find((item) => item.includes(drop)) ?? "");
  }
}

// 2) LinkedIn export: more sections, full dates, newest first.
check("LinkedIn dates: 'Mar 2021'", linkedInDate("Mar 2021") === "Mar 2021");
check("LinkedIn dates: '03/2021' → 'Mar 2021'", linkedInDate("03/2021") === "Mar 2021");
check("LinkedIn dates: 'September 2019' → 'Sep 2019'", linkedInDate("September 2019") === "Sep 2019");
const zip = zipSync({
  "Profile.csv": strToU8('First Name,Last Name,Headline,Summary,Geo Location,Websites\nAda,Okafor,Staff Engineer,"I build payments.\n\nI mentor juniors.",Lagos,"[PORTFOLIO:https://ada.dev,OTHER:https://github.com/adaokafor]"\n'),
  "Positions.csv": strToU8('Company Name,Title,Description,Location,Started On,Finished On\nPaystack,Senior Engineer,"Payments, at scale",Lagos,Jan 2017,Feb 2021\nNorthwind Pay,Staff Engineer,Platform,Remote,Mar 2021,\nAndela,Engineer,,Lagos,Jun 2015,Dec 2016\n'),
  "Education.csv": strToU8("School Name,Start Date,End Date,Notes,Degree Name,Activities\nUniversity of Lagos,2013,2017,,BSc Computer Science,Chess club\n"),
  "Certifications.csv": strToU8("Name,Url,Authority,Started On,Finished On,License Number\nAWS Certified Solutions Architect,https://aws.example/cert,Amazon Web Services,Jun 2022,,\n"),
  "Honors.csv": strToU8("Title,Description,Issued On\nEngineer of the Year,Northwind Pay,Dec 2023\n"),
  "Skills.csv": strToU8("Name\nGo\nPostgreSQL\n"),
});
const profile = await readLinkedInExport(new File([zip], "Basic_LinkedInDataExport.zip"));
check("LinkedIn: current role first", profile.experience?.[0]?.company === "Northwind Pay", profile.experience?.map((item) => item.company).join(" > "));
check("LinkedIn: then newest", profile.experience?.[1]?.company === "Paystack" && profile.experience?.[2]?.company === "Andela");
check("LinkedIn: month kept", profile.experience?.[1]?.start_date === "Jan 2017" && profile.experience?.[1]?.end_date === "Feb 2021");
check("LinkedIn: education", profile.education?.[0]?.school === "University of Lagos" && profile.education?.[0]?.degree === "BSc Computer Science");
check("LinkedIn: certification + award", profile.highlights?.length === 2 && profile.highlights?.[0]?.year === "2022" && profile.highlights?.[1]?.title === "Engineer of the Year");
check("LinkedIn: GitHub from websites", profile.github === "https://github.com/adaokafor");
check("LinkedIn: portfolio link kept", profile.links?.[0]?.url === "https://ada.dev" && profile.links?.[0]?.label === "Portfolio");
check("LinkedIn: two summary paragraphs", profile.summary?.length === 2);

// 3) The Investigator's checks, against pages like the ones it will meet.
const page = (html: string) => readHtml(`<html><head><title>T</title></head><body>${html}</body></html>`, "https://x.test");
const cases: [string, string, { title: string; organisation: string }, boolean, boolean][] = [
  ["announcement", "<h1>Northwind Pay appoints Ada Okafor as Head of Platform</h1>", { title: "Head of Platform", organisation: "Northwind Pay" }, true, true],
  ["name split across text", "<p>Okafor, Ada — speaking at DevConf Dubai</p>", { title: "Speaker at DevConf Dubai 2026", organisation: "DevConf Dubai" }, true, true],
  ["accents", "<p>Adá Okáfor joined the board</p>", { title: "Joined the board", organisation: "" }, true, true],
  ["another Ada", "<p>Ada Smith opens RustConf</p>", { title: "Keynote at RustConf", organisation: "RustConf" }, false, true],
  ["mentions them, not the claim", "<p>Ada Okafor's blog: thoughts on queues</p>", { title: "Head of Platform", organisation: "Northwind Pay" }, true, false],
  ["first name only", "<p>Ada gave a great talk at DevConf</p>", { title: "Talk at DevConf", organisation: "DevConf" }, false, true],
];
for (const [label, html, finding, person, claim] of cases) {
  const read = page(html);
  check(`verify (${label}): person ${person ? "found" : "not found"}`, mentionsPerson(read, "Ada Okafor") === person);
  check(`verify (${label}): claim ${claim ? "supported" : "not supported"}`, mentionsClaim(read, finding) === claim);
}
check("JSON-LD Person read", JSON.stringify(peopleFromJsonLd(['{"@graph":[{"@type":"Person","name":"Ada Okafor","jobTitle":"Head of Platform","worksFor":{"name":"Northwind Pay"}}]}'])) === '[{"name":"Ada Okafor","jobTitle":"Head of Platform","worksFor":"Northwind Pay"}]');
check("Reader ignores scripts and styles", !page("<script>var secret=1</script><style>.a{}</style><p>Hello</p>").text.includes("secret"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
