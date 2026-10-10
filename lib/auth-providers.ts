/** Which outside sign-in providers have keys on this server. Their buttons only show when they do. */
export const googleSignInReady = () => Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const githubSignInReady = () => Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
