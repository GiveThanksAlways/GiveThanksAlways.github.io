# givethanksalways.github.io

Personal site. Plain static HTML/CSS/JS, no build step; GitHub Pages serves it as-is (`.nojekyll`).

```bash
python3 -m http.server 4000   # http://localhost:4000
```

| Path | What |
|---|---|
| `index.html`, `assets/launch.js`, `assets/home.css` | Landing page: three.js rocket you can launch/steer/land (three.js from jsDelivr via importmap) |
| `projects/index.html` | Top projects (edit the list directly) |
| `posts/index.html`, `assets/posts.js` | X timeline, falling back to pinned post IDs in `posts.js` |
| `resume/index.html`, `assets/resume.tex` | Resume; rebuild the PDF from the `.tex` and replace `assets/Resume_Spencer_Willett.pdf` |
| `assets/telemetry.js` | Cookieless GoatCounter analytics + public visitor count |
| `assets/icons.svg` | Social icon sprite (Font Awesome Free brands, CC BY 4.0) |
| `about/`, `blog/` | Redirects for old URLs |

## GoatCounter setup

1. Sign up at <https://www.goatcounter.com> with the site code `givethanksalways`.
2. Settings → enable **"Allow adding visitor counts on your website"**.
