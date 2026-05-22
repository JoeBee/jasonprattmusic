# Jason Pratt Music

Static official site for Jason Pratt — upcoming shows, live videos, audio samples, and booking contact. No build step or backend: HTML, CSS, vanilla JavaScript, and JSON data files.

**Live site:** [jasonprattmusic.com](https://jasonprattmusic.com) (custom domain via `CNAME`)

## Project structure

```
index.html          Main page
404.html            Branded not-found page
css/site.css        Styles
js/main.js          Navigation, collapsibles, JSON loaders, media players
data/
  shows.json        Tour dates (filtered by visible + future dates)
  links.json        YouTube performance videos
  audio-files.json  MP3 filenames for the audio list
assets/
  top-banner.png    Header artwork
  cover-art-1.png   Audio section cover art
  audio-files/      Hosted MP3 samples
CNAME               Custom domain for GitHub Pages
favicon.svg
```

## Local preview

From the repository root, serve files over HTTP (required for `fetch()` to load JSON):

```bash
# Python 3
python -m http.server 8080

# Node (npx, no install)
npx --yes serve -l 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Updating content

1. Edit the JSON under `data/` (see field notes below).
2. For new audio, add the `.mp3` under `assets/audio-files/` and add the exact filename to `data/audio-files.json`.
3. Preview locally, then commit and deploy.

### `data/shows.json`

Each show object can include:

| Field | Purpose |
|-------|---------|
| `displayDate` | `M/D/YYYY` (used for sorting, filtering, and display) |
| `venue`, `city`, `comments` | Display text |
| `visible` | `"TRUE"` to show (case-insensitive) |
| `website`, `map` | Optional `https://` links |

Past dates and `visible` ≠ `"TRUE"` entries are hidden automatically.

### `data/links.json`

Array of `{ "url": "<YouTube URL>", "comments": "<label>" }`.

### `data/audio-files.json`

Array of MP3 filenames as they appear in `assets/audio-files/`.

## Deployment

The site is **static**. Upload the repo root (or publish via Git) to any static host. Do not deploy only a subfolder unless you adjust paths.

### GitHub Pages (recommended for this repo)

`CNAME` is already set for `jasonprattmusic.com`.

1. Push `main` (or your default branch) to GitHub.
2. In the repository: **Settings → Pages**.
3. **Source:** Deploy from branch.
4. **Branch:** `main` / **`/ (root)`**.
5. Save. DNS for the custom domain must point at GitHub Pages (see GitHub’s custom-domain docs).
6. Wait for the deployment; verify `https://jasonprattmusic.com`.

GitHub Pages serves `index.html` at `/` and `404.html` for missing paths.

### Netlify

1. Connect the GitHub repo.
2. **Build command:** leave empty.
3. **Publish directory:** `.` (repository root).
4. Add custom domain in Netlify DNS/domain settings.

### Cloudflare Pages

1. Create a project from Git.
2. **Framework preset:** None.
3. **Build command:** none.
4. **Build output directory:** `/` (root).
5. Attach `jasonprattmusic.com` in **Custom domains**.

### Manual upload

Copy the full site tree (HTML, CSS, JS, `data/`, `assets/`, `CNAME` if the host supports it) to the host’s web root or object-storage bucket with public read access and website hosting enabled.

## Site conventions

The codebase follows static-site best practices:

- **Semantics:** one `h1`, landmark regions, skip link, collapsible sections with `aria-expanded` / `aria-controls`.
- **Accessibility:** mobile menu toggle (≤700px), `aria-current="page"` on nav, reduced-motion support, 44px-ish touch targets.
- **Performance:** hero image preloaded; YouTube embeds and iframes load on demand; parallax uses scroll events (not a perpetual animation loop).
- **SEO:** canonical URL, Open Graph / Twitter meta, local keywords (Boston, Chelmsford, MA), JSON-LD `MusicGroup` + dynamic `MusicEvent` data from shows, `sitemap.xml`, and `robots.txt`.
- **Security:** external links use `rel="noopener noreferrer"`; only http(s) off-site links open in a new tab.
- **Data:** tour dates use `displayDate` in `shows.json`; duplicate date/venue rows are ignored at render time.

## Checklist before deploy

- [ ] JSON validates (no trailing commas; filenames match real files).
- [ ] New MP3s are committed or uploaded with the deploy.
- [ ] Spot-check: tour list, video thumbs, audio playback, contact mailto.
- [ ] Custom domain still resolves after DNS/host changes.

## License

Site content and recordings belong to Jason Pratt unless otherwise noted.
