# English Buddy

English Buddy is a lightweight English-learning app for children, built with React, Vite, TypeScript, and Tailwind CSS. It includes a child dashboard, vocabulary library, practice tasks, weekly quiz, and parent management tools.

## Features

- Child-friendly learning dashboard with mobile-first navigation
- Parent vocabulary management with add/edit/delete workflow
- Child-friendly word additions saved directly to shared vocabulary without signing in
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

The app starts with an empty word list when the environment variables are not set. If values are present but incorrect, database errors appear in the app rather than being silently replaced with sample data.

## Supabase schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Run the SQL in `supabase/schema.sql`. If you already ran an earlier version, run the whole file again; it no longer inserts sample vocabulary.
3. To erase every existing vocabulary row, run `supabase/reset-vocabulary.sql` once in the SQL Editor. This also removes word-practice progress linked to those words; quiz history remains.
4. In **Authentication → URL Configuration**, set the Site URL to `https://mohdshehab2009-byte.github.io/english-buddy/` and allow that URL as a redirect URL. Add the local development URL too if you test sign-up locally.
5. Open the app, choose **Parent view**, and create/sign in to a parent account. Confirm the email if Supabase asks.

Vocabulary is readable without signing in. Children can add a word and Arabic meaning without an account; public submissions are limited to these two fields and length-checked by RLS. Anyone can add rows, so do not collect personal or sensitive information in vocabulary. Authenticated parents can add richer words and edit or delete only words owned by their account. Profiles, progress, quiz results, and achievements are restricted to the owning parent by RLS. When a parent is signed in, quiz results and spelling/translation practice are saved to that parent's child profile.

Children can add a word from **Child view → My Words** using just its English spelling and Arabic meaning. Child words are saved directly to the shared Supabase vocabulary table and included in future quizzes; each quiz uses up to the 10 most recently added words.

The app creates or updates one child profile named Mujtaba per parent account. Quiz results and best spelling/translation scores appear in the child's **Progress** view and the parent's **Child Progress** and **Reports** views.

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
