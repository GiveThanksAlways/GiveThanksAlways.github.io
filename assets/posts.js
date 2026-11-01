// X feed. The live timeline widget is free but X often refuses to render it for
// logged-out visitors, so if it hasn't appeared after a few seconds we show these
// pinned posts instead. To pin a post, paste the number from its URL:
//   https://x.com/BeGrateful180/status/<THIS NUMBER>
{
  const PINNED = [
    "1822510398849077640",
  ];

  const feed = document.getElementById("feed");

  function showPinned() {
    feed.querySelectorAll(".twitter-timeline, iframe").forEach((el) => el.remove());
    if (window.twttr?.widgets) {
      PINNED.forEach((id) => {
        const slot = document.createElement("div");
        feed.appendChild(slot);
        twttr.widgets.createTweet(id, slot, { theme: "dark", dnt: true, conversation: "none" });
      });
    } else {
      // widgets.js blocked (e.g. by a content blocker): plain links.
      const p = document.createElement("p");
      p.className = "note";
      p.innerHTML = PINNED.map((id) => `<a href="https://x.com/BeGrateful180/status/${id}">x.com/BeGrateful180/status/${id} ↗</a>`).join("<br>");
      feed.appendChild(p);
    }
  }

  function timelineRendered() {
    const f = feed.querySelector("iframe[id^='twitter-widget']");
    return f && f.offsetHeight > 300;
  }

  const s = document.createElement("script");
  s.src = "https://platform.twitter.com/widgets.js";
  s.async = true;
  s.onerror = showPinned;
  document.head.appendChild(s);
  setTimeout(() => { if (!timelineRendered()) showPinned(); }, 6000);
}
