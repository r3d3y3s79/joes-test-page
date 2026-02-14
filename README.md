## Nugget Finder for YouTube

A lightweight front-end app for filtering YouTube videos and ranking them by practical value.

### What it does

- Accepts a niche/search query.
- Lets you define high-value keywords and low-signal keywords.
- Gives ranking boosts to trusted creators (preloaded: **Wes Roth** and **Matt Burman**).
- Uses a transparent scoring system so results are explainable.
- Includes a **transcript + on-screen visual extraction planner** for multimodal analysis.

> This version runs entirely in the browser and uses demo data.
> For live YouTube results and actual extraction, connect this interface to a backend pipeline.

### Run locally

1. Clone this repo.
2. Open `index.html` directly in your browser.

### Multimodal extraction approach (backend)

For each target video:

1. Download media with `yt-dlp`.
2. Pull subtitles (or run Whisper/WhisperX if subtitles are weak/missing).
3. Extract frames and/or scene boundaries with `ffmpeg` + scene detection.
4. Run OCR on frames to capture on-screen code/diagrams/labels.
5. Merge transcript and OCR signals by timestamp.
6. Rank high-value moments where speech and visuals reinforce each other.

### Future upgrades

- Add YouTube Data API integration with pagination.
- Save trusted creators and filters to local storage.
- Add separate ranking modes: freshness-first, depth-first, creator-first.
- Add backend workers for frame OCR and transcript alignment.
