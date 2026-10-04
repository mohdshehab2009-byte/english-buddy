# English Buddy

English Buddy is a lightweight English-learning app for children, built with React, Vite, TypeScript, and Tailwind CSS. It includes a child dashboard, vocabulary library, practice tasks, weekly quiz, and parent management tools.

## Features

- Child-friendly learning dashboard with mobile-first navigation
- Parent vocabulary management with add/edit/delete workflow
- Unit and week organization for learning content
- Practice tasks for listening, spelling, and translation
- Weekly quiz and progress tracking
- Achievement badges and points
- Supabase vocabulary reads and parent-authenticated vocabulary management

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` in PowerShell with `Copy-Item .env.example .env`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` using the project URL and publishable/anon key from Supabase.
4. Run `npm run dev`.

The app uses sample words in demo mode when the environment variables are not set. If values are present but incorrect, database errors appear in the app rather than being silently replaced with sample data.

## Supabase schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Run the SQL in `supabase/schema.sql`. If you already ran an earlier version, run the whole file again; the migration adds the profile/progress unique indexes required for saved learning results.
3. In **Authentication → URL Configuration**, set the Site URL to `https://mohdshehab2009-byte.github.io/english-buddy/` and allow that URL as a redirect URL. Add the local development URL too if you test sign-up locally.
4. Open the app, choose **Parent view**, and create/sign in to a parent account. Confirm the email if Supabase asks.

Vocabulary is readable without signing in. Only authenticated users can add vocabulary; each parent can edit or delete only words owned by that account. Profiles, progress, quiz results, and achievements are restricted to the owning parent by RLS. When a parent is signed in, quiz results and spelling/translation practice are saved to that parent's child profile. The child view can still be used signed out, but it will explain that those results are not saved.

The app currently creates one child profile named Musa per parent account. Quiz results and best spelling/translation scores appear in the child's **Progress** view and the parent's **Child Progress** and **Reports** views.

## Production build

Run `npm run build`.

## GitHub Pages deployment

The configured site URL is `https://mohdshehab2009-byte.github.io/english-buddy/`.

To deploy the Supabase-connected build:

1. In the GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the project URL and publishable/anon key from Supabase.
3. Push to `main`, or select **Actions → Deploy to GitHub Pages → Run workflow**. The workflow requires both values and stops with an error if either is missing.
4. In **Settings → Pages**, choose **Deploy from a branch**, then branch `gh-pages` and folder `/(root)` if this is not already selected.

The anon/publishable key is embedded in the client bundle and is not a secret. The database must be protected by the RLS policies in `supabase/schema.sql`. Never use or publish a Supabase service-role key. Local `.env` files are ignored by Git.

### Automatic GitHub Actions deployment

A GitHub Actions workflow is included in `.github/workflows/deploy.yml` and deploys on pushes to `main` or via **Actions → Deploy to GitHub Pages → Run workflow**.
