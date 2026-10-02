# Google sign-in setup

Formora uses Auth.js and Google OAuth. Authentication will not work until you configure a Google OAuth client and the environment variables below.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project.
2. Configure the OAuth consent screen. Use your production domain for the app homepage and privacy policy when you deploy.
3. Create an **OAuth client ID** of type **Web application**.
4. Add these authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` for local development
   - `https://YOUR-DOMAIN/api/auth/callback/google` for production
5. Copy `.env.example` to `.env.local` and set `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `DATABASE_URL`. Never commit `.env.local`.
6. Add the same values in your production host’s environment-variable settings, then redeploy.

Google sign-in returns a verified identity session. It does not give Formora the user’s Google password.

Signed-in users' portfolios are saved in PostgreSQL. Set `DATABASE_URL` too; the tables are created automatically the first time they are needed. See `.env.example` for every variable.
