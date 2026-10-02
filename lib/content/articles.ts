/**
 * Articles that ship with the site. Admins can edit or hide any of them at
 * /admin/journal: an edit is saved to the database under the same slug and
 * replaces the version here. New posts written there live only in the database.
 */
export interface BuiltInArticle { slug: string; title: string; description: string; category: string; publishedAt: string; body: string }

export const BUILT_IN_ARTICLES: BuiltInArticle[] = [
  {
    slug: "what-to-put-on-a-portfolio",
    title: "What to put on a portfolio when your work isn’t visual",
    description: "Nurses, accountants, salespeople and engineers can have a portfolio too. Here is what goes on one when you don’t make pictures for a living.",
    category: "Portfolio strategy",
    publishedAt: "2026-09-28",
    body: `Most portfolio advice is written for designers and photographers. If your work is a ward round, a closed quarter, a passed audit or a building that didn’t fall down, it can feel like a portfolio isn’t for you. It is. You just show different evidence.

## Show outcomes, not duties

A job description lists duties. A portfolio shows what happened because you were there. Compare:

- “Responsible for month-end close” with “Cut month-end close from nine days to five”.
- “Managed a sales territory” with “Grew the North West territory from £1.2m to £2.1m in two years”.
- “Ward nurse” with “Led the falls-prevention project that halved falls on a 28-bed ward”.

Each second version is a small story with a number in it. That’s the unit a portfolio is built from.

## Pick three to five pieces of work

Choose the projects you’d want to be asked about in an interview. For each one, write:

1. **The situation.** One or two sentences of context.
2. **What you did.** Your part, not the team’s.
3. **What changed.** A number if you have one, a sentence from someone who noticed if you don’t.

If confidentiality matters, describe the problem and the result without names. “A regional hospital trust” is enough.

## Use proof people can check

Qualifications, registrations and memberships matter more in regulated work than any design choice. Put your registration number, licence or chartered status where people will see it. Add the courses that are relevant to the job you want, not every certificate you have.

## Let someone else speak

A short quote from a manager, client or patient’s family does more than a paragraph of self-description. Ask for permission, keep it to two sentences, and attribute it with a role rather than a full name if they prefer.

## Make contacting you easy

End with a clear next step: an email address, a phone number, a booking link. If you’re not looking for work, say what you *are* open to: speaking, mentoring, consulting.

Formora has templates drawn for these jobs specifically. [Find yours by job title](/for) and you’ll start with sample content written for your role, which makes the blank page much less blank.`,
  },
  {
    slug: "write-a-portfolio-introduction",
    title: "How to write an introduction people actually finish",
    description: "The first two lines of your portfolio decide whether anyone reads the rest. A simple formula for writing them.",
    category: "Writing",
    publishedAt: "2026-09-24",
    body: `People decide in a few seconds whether your portfolio is relevant to them. The introduction is where they decide. Most introductions waste those seconds on adjectives.

## The formula

Write one sentence that answers three questions:

- **What do you do?** In words your client or employer would use.
- **Who for?** The people or organisations you’re best at helping.
- **What’s different?** The specific thing you’re known for.

For example: *“I’m a family solicitor in Leeds who helps parents agree arrangements without going to court.”* Or: *“Backend engineer who makes payment systems boring, in the good way.”*

## Cut these words

“Passionate”, “driven”, “results-oriented”, “innovative” and “hard-working” tell the reader nothing they can check. Replace each one with evidence. Instead of *passionate about teaching*, write *I’ve taught GCSE maths for eleven years and run the school’s after-hours revision club*.

## Then add one paragraph

Below the one-line introduction, write a short paragraph with the context a stranger needs: where you’ve worked, what you’re working on now, and what you’d like to do next. Keep it under eighty words. You can always link to more.

## Read it aloud

If you wouldn’t say it to someone at a conference, rewrite it. Spoken language is clearer than written language, and it sounds like you.

## Test it

Show the introduction to someone outside your field for five seconds, then ask them what you do. If they can’t say it back, it’s not clear enough yet.

In the Formora editor, the *One-line introduction* field is this sentence. The AI assistant can suggest tighter versions, but the best ones always start from something you’ve written yourself.`,
  },
  {
    slug: "portfolio-project-case-study",
    title: "A simple structure for a project case study",
    description: "Problem, approach, result: a four-part structure that makes any project easy to follow, with examples from different jobs.",
    category: "Case studies",
    publishedAt: "2026-09-20",
    body: `A case study is just a well-told project. The structure below works for a rebrand, a hospital audit, a kitchen refit or a sales campaign.

## 1. The problem, in one sentence

Start with what was wrong or what was needed. *“The clinic’s waiting list had grown to fourteen weeks.”* A reader who understands the problem will care about the solution.

## 2. Your role

Say plainly what you were responsible for and who else was involved. Hiring managers read this part closely. *“I led the triage redesign with two nurse practitioners and the practice manager.”*

## 3. What you did

Describe the two or three decisions that mattered, and why you made them. Leave out the things anyone would have done. The interesting part is usually a trade-off: what you chose not to do.

## 4. What happened

Give the result, ideally with a number and a time frame. *“Waiting time fell to five weeks within a quarter.”* If the project didn’t go to plan, say what you learned. Honest results build more trust than perfect ones.

## Add one image or artefact

A photo, a diagram, a before-and-after, a page of the report, a screenshot. Even in non-visual work, one artefact makes the project feel real. Blur anything confidential.

## Keep it short

Three hundred words is plenty for most projects. If someone wants more, they’ll ask, and that conversation is the point of the portfolio.

Every Formora template has a projects section with fields for exactly these parts: title, context, your role, description, image and links.`,
  },
  {
    slug: "choose-portfolio-template",
    title: "How to choose a portfolio template that fits your work",
    description: "Pick a design for the people who will read it, not for yourself. Four questions that make the choice quick.",
    category: "Design",
    publishedAt: "2026-09-16",
    body: `A template should make your work easier to understand. It shouldn’t compete with it. Ask these four questions and the choice usually makes itself.

## Who is reading it?

A recruiter scanning fifty candidates wants a clear structure and your experience near the top. A client choosing a photographer wants big images and very little text. A patient choosing a private consultant wants qualifications, specialisms and how to book. Choose the template whose first screen answers your reader’s first question.

## What is your strongest evidence?

If it’s images, choose a design with large image areas. If it’s numbers, choose one that puts figures up front. If it’s writing or publications, choose a design with generous text and a references list. If it’s testimonials, choose one that gives quotes room.

## How much content do you have?

Some designs look best with ten projects; some with three. A sparse template with plenty of content feels cramped, and a dense one with little content feels empty. Preview the template with sample content for your job title and compare it with what you actually have.

## Does it suit your field’s tone?

A law firm partner and a tattoo artist both deserve a good portfolio, but not the same one. Pick a tone your clients would expect, then use colours and type to make it yours.

## Don’t worry about getting it wrong

In Formora your content is stored separately from the design, so you can switch templates later without retyping anything. [Browse the templates](/templatechooser) or [search by job title](/for).`,
  },
  {
    slug: "own-domain-name-for-portfolio",
    title: "Why your portfolio should be on your own domain name",
    description: "yourname.com looks more professional, is easier to remember and stays yours if you change platforms. How to get one and what it costs.",
    category: "Getting online",
    publishedAt: "2026-09-12",
    body: `A portfolio at *yourname.com* is easier to say out loud, easier to put on a business card and harder to forget than one buried in someone else’s web address.

## It’s yours

You can move a domain name between providers. If you ever change how your site is built, the address on your CV, your email signature and your old LinkedIn posts still works.

## It looks established

People notice addresses. A personal domain signals that you take your practice seriously, in the same way a proper email address does.

## What to choose

- **Your name**, if it’s available: *janeokafor.com*.
- **Your name plus your field**: *janeokaforlaw.com*, *okaforphotography.co.uk*.
- **A short practice name**, if you trade under one.

Prefer *.com* or your country’s domain (*.co.uk*, *.ie*, *.com.au*). Avoid hyphens and numbers; they’re hard to say. Check the spelling out loud.

## What it costs

Most names cost between $10 and $40 a year. Unusual endings like *.studio* or *.design* can cost more, and some short names are sold at premium prices. Renewal prices can differ from the first year, so check both.

## Connecting it

In Formora you can buy a domain inside the editor and it connects automatically, with HTTPS set up for you. If you already own one, add the DNS records the editor shows you at your registrar and we verify them for you. Either way your portfolio is live on your own address in minutes.`,
  },
  {
    slug: "portfolio-for-career-change",
    title: "Building a portfolio when you’re changing careers",
    description: "You don’t need experience in the new field to show you can do the job. How to use transferable work and small projects as evidence.",
    category: "Career",
    publishedAt: "2026-09-08",
    body: `Changing careers creates a chicken-and-egg problem: you need experience to get the job, and the job to get experience. A portfolio breaks the loop because it shows ability, not job titles.

## Translate what you’ve already done

List the projects from your current job that use the skills the new job needs. A teacher moving into learning design has written curricula. A retail manager moving into operations has run rotas, stock and budgets. Describe these projects in the language of the new field.

## Do two or three small projects

Pick realistic briefs and do them properly: redesign a local charity’s donation page, analyse a public dataset, write a policy brief, build a simple app. Small and finished beats ambitious and abandoned. Say clearly that they are self-initiated.

## Explain the move in one paragraph

People wonder why you’re changing. Answer it before they ask: what drew you to the new field, what you’ve done to prepare, and what you bring from before that others don’t.

## Get one external voice

A testimonial from a course tutor, a volunteer coordinator or a client from a side project makes the change feel less risky to an employer.

## Keep your history, briefly

Don’t hide your previous career. Put it in the experience section with one line per role. Years of reliable work are evidence too.

Formora lets you keep separate portfolios with different templates, so you can have one for the old field and one for the new while you make the move.`,
  },
  {
    slug: "keep-your-portfolio-up-to-date",
    title: "Keeping your portfolio up to date without it becoming a chore",
    description: "A fifteen-minute routine every quarter keeps a portfolio current. What to add, what to remove, and what to automate.",
    category: "Workflow",
    publishedAt: "2026-09-04",
    body: `Most portfolios are out of date because updating them feels like a project. It doesn’t have to be. A short routine, done regularly, keeps yours current.

## Every quarter, fifteen minutes

Put a recurring reminder in your calendar and work through this list:

1. **Add** anything you finished that you’d want to talk about.
2. **Remove** anything you’d no longer want to be asked about.
3. **Update** numbers: years of experience, clients, results.
4. **Check** every link and contact detail still works.
5. **Re-read** your introduction. Does it still describe what you want to do next?

## Keep a running list

When something goes well at work, write one line in a note: what happened, the date, and any number. At update time you’ll have material instead of a blank page.

## Remove more than you add

A portfolio with five great projects beats one with fifteen mixed ones. Every weaker project makes the strong ones harder to find.

## Let the boring parts update themselves

If you publish code, talks or articles, Formora can check your GitHub and public profiles and suggest updates for you to approve. Nothing changes until you say so.

## Publish, then improve

Your portfolio doesn’t have to be finished to be useful. Publish the good-enough version today, and let the quarterly routine make it better over time.`,
  },
  {
    slug: "portfolio-accessibility-basics",
    title: "Accessibility basics every portfolio should get right",
    description: "Readable text, real alt text, enough contrast and links that make sense: small changes that help every visitor.",
    category: "Design",
    publishedAt: "2026-08-31",
    body: `An accessible portfolio is easier for everyone to use, including the hiring manager reading it on a phone on a train. These basics cover most of it.

## Write real alt text

Describe what an image shows and why it matters: *“Before-and-after of the restored Victorian bay window”* rather than *“image1”*. If an image is purely decorative, leave its description empty so screen readers skip it.

## Keep contrast high

Light grey text on white looks elegant and is hard to read. If you set your own accent colour, check that text on it, and links in it, stay easy to read.

## Make links say where they go

*“Read the case study”* is better than *“click here”*. People using screen readers often jump from link to link, so each one should make sense on its own.

## Use headings in order

Headings give a page its structure. Templates handle this for you; just keep your section titles short and descriptive.

## Don’t rely on motion

Moving templates in Formora respect your visitors’ *reduce motion* setting automatically and show everything in its finished state.

## Check on a phone

Most first visits now happen on a phone. Open your portfolio on yours before you share it, and use the editor’s phone preview while you work.`,
  },
];
