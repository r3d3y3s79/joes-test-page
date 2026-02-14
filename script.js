const sampleVideos = [
  {
    title: "Claude Code Agents + Sub-Agents Deep Dive (Real Workflow)",
    channel: "Matt Burman",
    views: 48200,
    publishedDaysAgo: 12,
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    description: "Full coding walkthrough with repo structure, skill orchestration, and practical examples.",
  },
  {
    title: "OpenClaw Setup Guide + Production Pitfalls",
    channel: "Wes Roth",
    views: 73800,
    publishedDaysAgo: 19,
    url: "https://www.youtube.com/watch?v=oHg5SJYRHA0",
    description: "Implementation-first tutorial with benchmark results and cautionary notes.",
  },
  {
    title: "Top 10 AI Agent News This Week",
    channel: "TrendPulse AI",
    views: 910000,
    publishedDaysAgo: 1,
    url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    description: "Fast recap of industry updates with limited technical depth.",
  },
  {
    title: "Build and Evaluate Sub-Agents in Claude Code",
    channel: "Practical Agent Lab",
    views: 16400,
    publishedDaysAgo: 8,
    url: "https://www.youtube.com/watch?v=V-_O7nl0Ii0",
    description: "Step-by-step implementation, measurable evals, and reproducible repo.",
  },
  {
    title: "Auto-generated AI News Loop (24/7)",
    channel: "NoFace Streams",
    views: 302000,
    publishedDaysAgo: 0,
    url: "https://www.youtube.com/watch?v=Zi_XLOBDo_Y",
    description: "Automated stream with synthetic voice and recycled clips.",
  },
  {
    title: "Antigravity + GitHub Projects: Complete Build Session",
    channel: "Code Frontier",
    views: 20400,
    publishedDaysAgo: 27,
    url: "https://www.youtube.com/watch?v=tVj0ZTS4WF4",
    description: "Long-form coding session with debugging, architecture choices, and source code review.",
  },
];

const trustedChannels = new Set(["Wes Roth", "Matt Burman"]);

const searchForm = document.getElementById("search-form");
const trustedForm = document.getElementById("trusted-form");
const pipelineForm = document.getElementById("pipeline-form");
const trustedInput = document.getElementById("trusted-input");
const trustedList = document.getElementById("trusted-list");
const results = document.getElementById("results");
const pipelineOutput = document.getElementById("pipeline-output");
const template = document.getElementById("video-card-template");

function toKeywordArray(value) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function scoreVideo(video, options) {
  const title = video.title.toLowerCase();
  const description = video.description.toLowerCase();

  let score = 45;
  const signals = [];

  if (trustedChannels.has(video.channel)) {
    score += 25;
    signals.push("Trusted creator");
  }

  const valueHits = options.valueKeywords.filter(
    (keyword) => title.includes(keyword) || description.includes(keyword),
  ).length;
  if (valueHits > 0) {
    const bonus = Math.min(valueHits * 8, 24);
    score += bonus;
    signals.push(`Value keyword matches (+${bonus})`);
  }

  const avoidHits = options.avoidKeywords.filter(
    (keyword) => title.includes(keyword) || description.includes(keyword),
  ).length;
  if (avoidHits > 0) {
    const penalty = avoidHits * 15;
    score -= penalty;
    signals.push(`Low-signal pattern detected (-${penalty})`);
  }

  if (video.publishedDaysAgo <= 2) {
    score -= 5;
    signals.push("Very recent (can be hype-heavy)");
  }

  if (video.views > 500000) {
    score -= 4;
    signals.push("Mass-audience topic (slight penalty)");
  }

  const queryMatch = options.query
    .split(" ")
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean)
    .some((term) => title.includes(term) || description.includes(term));

  if (!queryMatch) {
    score -= 18;
    signals.push("Weak query relevance");
  }

  return {
    ...video,
    score: Math.max(0, Math.min(100, score)),
    signals,
  };
}

function formatViews(views) {
  return new Intl.NumberFormat("en-US", { notation: "compact" }).format(views);
}

function getVideoId(videoUrl) {
  try {
    const url = new URL(videoUrl);
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }
    return url.searchParams.get("v") || "VIDEO_ID";
  } catch {
    return "VIDEO_ID";
  }
}

function renderPipeline(videoUrl) {
  const videoId = getVideoId(videoUrl);
  const safeUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`;

  const commands = [
    `yt-dlp -f \"bv*+ba/b\" -o \"${videoId}.%(ext)s\" \"${safeUrl}\"`,
    `yt-dlp --write-auto-sub --sub-lang en --skip-download -o \"${videoId}\" \"${safeUrl}\"`,
    `ffmpeg -i ${videoId}.mp4 -vf fps=1 frames/${videoId}_%05d.jpg`,
    `python ocr_extract.py --frames-dir frames --out visual_signals.json`,
    `python merge_modalities.py --subs ${videoId}.en.vtt --visual visual_signals.json --out nuggets.json`,
  ];

  const steps = [
    "Fetch video + audio with yt-dlp for local frame-level analysis.",
    "Pull subtitles first. If no reliable subtitles exist, run WhisperX/Whisper for transcript.",
    "Sample frames (or scene boundaries) with ffmpeg + PySceneDetect so slides/code snippets are captured.",
    "Run OCR (Tesseract or PaddleOCR) over extracted frames and deduplicate recurring text.",
    "Use timestamp alignment to merge transcript snippets + OCR snippets into one timeline.",
    "Rank moments where spoken terms and on-screen text overlap (usually highest-value segments).",
  ];

  pipelineOutput.innerHTML = `
    <article class="card">
      <h3>Recommended multimodal workflow</h3>
      <ul class="pipeline-list">
        ${steps.map((step) => `<li>${step}</li>`).join("")}
      </ul>
    </article>
    <article class="card">
      <h3>Starter command sequence</h3>
      <ul class="pipeline-code">
        ${commands.map((command) => `<li><code>${command}</code></li>`).join("")}
      </ul>
      <p class="hint">Note: Respect YouTube Terms of Service and creator rights. This app generates a plan; execution should run in your backend pipeline.</p>
    </article>
  `;
}

function renderTrustedChannels() {
  trustedList.innerHTML = "";
  [...trustedChannels].sort().forEach((channel) => {
    const item = document.createElement("li");
    item.textContent = channel;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "✕";
    removeButton.setAttribute("aria-label", `Remove ${channel}`);
    removeButton.addEventListener("click", () => {
      trustedChannels.delete(channel);
      renderTrustedChannels();
    });

    item.appendChild(removeButton);
    trustedList.appendChild(item);
  });
}

function renderResults(videos) {
  results.innerHTML = "";

  if (videos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No videos met your threshold. Lower your filters or expand your query.";
    results.appendChild(empty);
    return;
  }

  videos.forEach((video) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".title").textContent = video.title;
    fragment.querySelector(".score").textContent = `${video.score}/100`;
    fragment.querySelector(".meta").textContent = `${video.channel} • ${formatViews(video.views)} views • ${video.publishedDaysAgo} days ago`;
    fragment.querySelector(".description").textContent = video.description;

    const signalsEl = fragment.querySelector(".signals");
    video.signals.forEach((signal) => {
      const item = document.createElement("li");
      item.textContent = signal;
      signalsEl.appendChild(item);
    });

    const link = fragment.querySelector(".watch-link");
    link.href = video.url;

    results.appendChild(fragment);
  });
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(searchForm);
  const options = {
    query: String(formData.get("query") || "").trim(),
    valueKeywords: toKeywordArray(String(formData.get("valueKeywords") || "")),
    avoidKeywords: toKeywordArray(String(formData.get("avoidKeywords") || "")),
    credibilityThreshold: Number(formData.get("credibilityThreshold") || 65),
    maxResults: Number(formData.get("maxResults") || 8),
  };

  const ranked = sampleVideos
    .map((video) => scoreVideo(video, options))
    .filter((video) => video.score >= options.credibilityThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.maxResults);

  renderResults(ranked);
});

trustedForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = trustedInput.value.trim();
  if (!value) {
    return;
  }

  trustedChannels.add(value);
  trustedInput.value = "";
  renderTrustedChannels();
});

pipelineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(pipelineForm);
  const videoUrl = String(formData.get("videoUrl") || "").trim();
  renderPipeline(videoUrl);
});

renderTrustedChannels();
searchForm.requestSubmit();
renderPipeline("https://www.youtube.com/watch?v=VIDEO_ID");
