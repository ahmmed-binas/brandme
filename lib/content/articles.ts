export type Article = { slug: string; title: string; excerpt: string; category: string; date: string; readTime: string; body: string[] };

const seeds = [
  ["portfolio-detail-that-builds-trust", "The portfolio detail that makes great work easier to trust", "Portfolio strategy", "A strong portfolio makes your decisions, outcomes, and point of view easy for the right people to understand."],
  ["write-a-portfolio-introduction", "How to write an introduction people actually finish", "Writing", "A useful opening gives context quickly, then earns the reader’s attention with specifics."],
  ["show-process-not-just-outcomes", "Show the process, not just the polished outcome", "Portfolio strategy", "The work is stronger when people can see the thinking that led to it."],
  ["portfolio-project-case-study", "A simpler structure for a compelling project case study", "Case studies", "Use a clear problem, a considered approach, and an honest result to tell the story."],
  ["choose-portfolio-template", "Choose a template that supports your work", "Design", "The best portfolio template creates emphasis without competing with your work."],
  ["portfolio-for-career-change", "Build a portfolio when you are changing careers", "Career", "Frame transferable skills through the projects and decisions that prove them."],
  ["edit-portfolio-with-confidence", "Edit your portfolio with more confidence", "Writing", "A short, specific portfolio is usually more persuasive than a complete archive."],
  ["prepare-portfolio-review", "Prepare a portfolio for a thoughtful review", "Career", "Make it easy for someone busy to understand your role, your contribution, and your direction."],
  ["portfolio-accessibility-basics", "Portfolio accessibility is part of a good first impression", "Design", "Accessible structure gives every visitor a more dependable way to understand your work."],
  ["document-tools-for-creatives", "The small document tools that save creative time", "Workflow", "Simple, privacy-aware tools can remove friction before it becomes a whole afternoon."],
] as const;

export const articles: Article[] = seeds.map(([slug, title, category, excerpt], index) => ({ slug, title, category, excerpt, date: `September ${20 - index}, 2026`, readTime: `${4 + (index % 3)} min read`, body: [excerpt, "Start with the information your reader needs most. Clear hierarchy and a considered edit make good work easier to discover.", "Treat the portfolio as a living document: revisit it after meaningful work, remove what no longer represents you, and keep the next step obvious."] }));
export const ARTICLES_PER_PAGE = 6;
export const totalArticlePages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
export const getArticle = (slug: string) => articles.find((article) => article.slug === slug);
export const getArticlePage = (page: number) => articles.slice((page - 1) * ARTICLES_PER_PAGE, page * ARTICLES_PER_PAGE);
