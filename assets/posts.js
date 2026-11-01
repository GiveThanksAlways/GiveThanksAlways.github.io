// Blog: try X's live profile timeline; keep a few hand-picked posts below it.
// X's timeline embed only renders for some visitors and the X API is paid, so the
// pinned list is the reliable part. To add a post, paste the number from its URL:
//   https://x.com/BeGrateful180/status/<THIS NUMBER>
{
  const POSTS = [
    "1822510398849077640", // Team USA / Steph Curry, Aug 2024
  ];

  const feed = document.getElementById("feed");
  const timeline = document.getElementById("timeline");
  const link = (id) => `https://x.com/BeGrateful180/status/${id}`;

  // Plain links first, so something shows even if X's script is blocked.
  POSTS.forEach((id) => {
    const slot = document.createElement("div");
    slot.innerHTML = `<p class="note"><a href="${link(id)}">${link(id).replace("https://", "")} ↗</a></p>`;
    feed.appendChild(slot);
  });

  const dropTimeline = () => { if (timeline) timeline.innerHTML = ""; };
  const s = document.createElement("script");
  s.src = "https://platform.twitter.com/widgets.js";
  s.async = true;
  s.onerror = dropTimeline;
  s.onload = () => {
    if (!window.twttr?.widgets) return dropTimeline();
    [...feed.children].forEach((slot, i) => {
      twttr.widgets
        .createTweet(POSTS[i], slot, { theme: "dark", dnt: true, conversation: "none" })
        .then((el) => { if (el) slot.querySelector(".note")?.remove(); });
    });
  };
  document.head.appendChild(s);

  // If X declines to render the profile timeline, remove the empty space it leaves.
  setTimeout(() => {
    const frame = timeline?.querySelector("iframe");
    if (!frame || frame.offsetHeight < 200) dropTimeline();
  }, 7000);
}
