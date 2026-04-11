---
layout: page
title: Resume
permalink: /resume/
weight: 3
---

<iframe id="resumeFrame" src="/assets/Resume_Spencer_Willett.pdf" width="100%" style="height: 100%;">
    This browser does not support PDFs. Please download the PDF to view it: <a href="/assets/Resume_Spencer_Willett.pdf">Download PDF</a>
</iframe>

<script>
  function resizeIframe() {
    var iframe = document.getElementById('resumeFrame');
    if (iframe) {
      // Calculate available height
      var availableHeight = window.innerHeight;

      // Adjust for any elements above the iframe
      var rect = iframe.getBoundingClientRect();
      var topOffset = rect.top;

      // Set iframe height to fill remaining space
      iframe.style.height = (availableHeight - topOffset) + 'px';
    }
  }

  // Initial resize
  resizeIframe();

  // Resize on window resize
  window.addEventListener('resize', resizeIframe);

  // Resize after page load to account for any dynamic content
  window.addEventListener('load', resizeIframe);
</script>
