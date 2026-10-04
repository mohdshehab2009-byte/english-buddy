# English Buddy

English Buddy is a lightweight English-learning app for children, built with React, Vite, TypeScript, and Tailwind CSS. It includes a child dashboard, vocabulary library, practice tasks, weekly quiz, and parent management tools.

## Features

- Child-friendly learning dashboard with mobile-first navigation
- Parent vocabulary management with add/edit/delete workflow
- Unit and week organization for learning content
- Practice tasks for listening, spelling, and translation
- Weekly quiz and progress tracking
- Achievement badges and points
- Supabase-ready hooks and schema for future database integration

## Local development

1. Install dependencies:
   npm install
2. Copy the environment file:
   cp .env.example .env
3. Add your Supabase values:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Start the app:
   npm run dev

## Single required Supabase configuration step

Create a project in Supabase and add the generated URL and anon key to a local `.env` file based on `.env.example`.

The app is intentionally designed to work with sample data immediately when Supabase is not configured yet, so the interface can be used and reviewed without a live database connection.

## Supabase schema

The SQL schema is available in `supabase/schema.sql`.

## Production build

npm run build

## GitHub Pages deployment

The configured site URL is:
`https://mohdshehab2009-byte.github.io/english-buddy/`

Push changes to `main` to trigger the GitHub Actions workflow. It builds the app and publishes the `dist` directory to the `gh-pages` branch. In the repository's **Settings → Pages**, select **Deploy from a branch**, then choose `gh-pages` and `/(root)` if Pages is not already configured.

The workflow intentionally does not use local `.env` values, so the published site runs in demo mode. Do not commit `.env` or add Supabase keys to source code. To publish live data, first implement parent authentication and database Row Level Security, then configure suitable GitHub Actions secrets and inject them at build time.

You can also publish manually with `npm run deploy` after authenticating Git with GitHub.

### Automatic GitHub Actions deployment

A GitHub Actions workflow is included in `.github/workflows/deploy.yml` and deploys on pushes to `main` or via **Actions → Deploy to GitHub Pages → Run workflow**.
