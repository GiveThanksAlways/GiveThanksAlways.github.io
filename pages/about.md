---
layout: page
title: About
permalink: /about/
weight: 3
---

<!-- # **About Me** -->

<!-- Hi I am **{{ site.author.name }}** :wave:,<br> -->

<!-- I am a Software Engineer. -->

<div class="row">
{% include about/timeline.html title="Work Experience" source=site.data.timeline %}
</div>

<div class="row">
{% include about/timeline.html title="Education" source=site.data.timeline-education %}
</div>

<div class="row">
{% include about/skills.html title="Programming Skills" source=site.data.programming-skills %}
{% include about/skills.html title="Other Skills" source=site.data.other-skills %}
</div>