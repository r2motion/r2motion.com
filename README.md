# (r2)motion by Renzo M.

Premium interactive website for `(r2)motion`, built with Vite, React, TypeScript, Framer Motion, and Decap CMS.

## Local Development

```bash
npm install
npm run dev
```

The site runs through Vite. The Decap CMS admin lives at `/admin/`.

## Portfolio Editing

Portfolio entries are JSON files in `src/content/portfolio`.

Each project supports:

- `title`, `slug`, `year`, `category`
- `summary`, `description`
- `services`, `technologies`, `metrics`
- `coverImage`, `accentColor`, `featured`, `order`
- optional `liveUrl` and `caseStudyUrl`

Cover images upload to `public/uploads/portfolio` and are referenced with `/uploads/portfolio/file-name.ext`.

## Clients And Partners

Client and partner entries are JSON files in `src/content/partners`.

Each entry supports:

- `name`, `slug`, `logoText`, `relationshipType`, `category`
- optional `logoImage` and `websiteUrl`
- `featured`, `order`

Use `relationshipType` as `client` or `partner`; the site renders those as separate full-width sections.

Logo uploads go to `public/uploads/partners` and are referenced with `/uploads/partners/file-name.ext`.

## CMS Setup

Decap CMS is configured in `public/admin/config.yml`.

Current backend target:

```yaml
repo: r2motion/r2motion.com
branch: main
base_url: https://cms-auth.r2motion.com
auth_endpoint: auth
```

For own hosting, deploy a small GitHub OAuth bridge at `https://cms-auth.r2motion.com`, or change `base_url` to the deployed bridge URL.

## Deployment

GitHub Actions builds the site and uploads `dist/` by SFTP.

Add these repository secrets before pushing to `main`:

- `SFTP_HOST`
- `SFTP_USERNAME`
- `SFTP_PASSWORD` or `SFTP_PRIVATE_KEY`
- `SFTP_PORT`
- `SFTP_TARGET_PATH`

Then every push to `main`, including CMS portfolio edits, can trigger a fresh build and upload.
