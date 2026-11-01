// Blog feed: embeds the X posts listed below, newest first.
// X's free "timeline" widget no longer renders reliably and the X API is paid,
// so posts are listed by hand. To add one, paste the number from its URL:
//   https://x.com/BeGrateful180/status/<THIS NUMBER>
{
  const POSTS = [
    "1822510398849077640",
  ];

  const feed = document.getElementById("feed");
  const link = (id) => `https://x.com/BeGrateful180/status/${id}`;

  // Plain links first, so something shows even if X's script is blocked.
  POSTS.forEach((id) => {
    const slot = document.createElement("div");
    slot.innerHTML = `<p class="note"><a href="${link(id)}">${link(id).replace("https://", "")} ↗</a></p>`;
    feed.appendChild(slot);
  });

  const s = document.createElement("script");
  s.src = "https://platform.twitter.com/widgets.js";
  s.async = true;
  s.onload = () => {
    if (!window.twttr?.widgets) return;
    [...feed.children].forEach((slot, i) => {
      twttr.widgets
        .createTweet(POSTS[i], slot, { theme: "dark", dnt: true, conversation: "none" })
        .then((el) => { if (el) slot.querySelector(".note")?.remove(); });
    });
  };
  document.head.appendChild(s);
}
