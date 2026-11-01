# givethanksalways.github.io

Personal site. Plain static HTML/CSS/JS, no build step; GitHub Pages deploys the `production` branch as-is (`.nojekyll`); keep `master` in sync.

```bash
python3 -m http.server 4000   # http://localhost:4000
```

| Path | What |
|---|---|
| `index.html`, `assets/home.css`, `assets/vendor/particleground.js` | Landing page: gold particle-line background ([particleground](https://github.com/jnicol/particleground), MIT) behind the logo and social links |
| `projects/index.html` | Top projects (edit the list directly) |
| `blog/index.html`, `assets/posts.js` | Embedded X posts; add a post by pasting its ID into `posts.js` |
| `books/index.html`, `assets/img/books/` | Book recommendations (covers from Open Library) |
| `resume/index.html`, `assets/resume.tex` | Resume; edit the `.tex`, then run `assets/build-resume.sh` to rebuild the PDF + preview image |
| `assets/telemetry.js` | Cookieless GoatCounter analytics + public visitor count |
| `assets/icons.svg` | Icosahedron logo + social icon sprite (brand icons: Font Awesome Free, CC BY 4.0) |
| `about/` | Redirect to `/resume/` for the old URL |

## GoatCounter setup

1. Sign up at <https://www.goatcounter.com> with the site code `givethanksalways`.
2. Settings → enable **"Allow adding visitor counts on your website"**.
