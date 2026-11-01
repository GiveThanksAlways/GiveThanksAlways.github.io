// Cookieless visitor analytics via GoatCounter (https://www.goatcounter.com).
// No cookies, no personal data stored, so no consent banner is needed.
//
// Setup (one time): sign up at goatcounter.com with the code below, then in
// Settings enable "Allow adding visitor counts on your website".
{
  const GOATCOUNTER_CODE = "givethanksalways";
  const BASE = `https://${GOATCOUNTER_CODE}.goatcounter.com`;

  // Record the page view (count.js ignores localhost on its own).
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.dataset.goatcounter = `${BASE}/count`;
  document.head.appendChild(s);

  // Fill any [data-visitors] element with the site-wide total.
  const targets = document.querySelectorAll("[data-visitors]");
  if (targets.length) {
    fetch(`${BASE}/counter/TOTAL.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => targets.forEach((el) => (el.textContent = d.count)))
      .catch(() => targets.forEach((el) => (el.textContent = "—")));
  }
}
