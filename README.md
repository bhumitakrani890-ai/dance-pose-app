# 💃 Dance Pose Trainer

A web app that helps dancers practice choreography by comparing their live webcam movements against a reference dance video — in real time, with a mirrored view and a timing-aware match score.

**Live demo:** [dance-pose-app.vercel.app](https://dance-pose-app.vercel.app)

## The Problem

Learning choreography from a video is hard when:
- The video moves too fast to follow and correct yourself in real time
- Mirroring left/right constantly breaks concentration
- There's no way to know *how close* you actually are to the correct pose, beyond "it looks kind of right"

This project solves all three: it mirrors your webcam so screen-side matches screen-side, runs pose detection on both you and the reference video simultaneously, and scores how well your joint positions match — including a timing-aware score that doesn't unfairly punish you for being a beat early or late.

## Features

- **Live webcam pose tracking** using Google's MediaPipe Pose model
- **Upload any reference video** from your device (not locked to a single hardcoded file)
- **Mirrored webcam view** so left/right always matches what you see on screen, like a real mirror
- **Real-time joint angle comparison** (elbows, knees) between you and the reference video
- **Live match score** (0–100%), color-coded green/orange/red for instant feedback
- **Timing-aware score** using a custom-built Dynamic Time Warping (DTW) algorithm, so being slightly ahead or behind the video's timing doesn't unfairly tank your score
- Clean, responsive dark-themed UI

## How It Works

1. **Pose detection:** MediaPipe Pose extracts 33 body keypoints (shoulders, elbows, wrists, hips, knees, ankles, etc.) from both the webcam feed and the uploaded reference video, frame by frame, directly in the browser.
2. **Joint angle calculation:** using basic trigonometry (`Math.atan2`), the app calculates the angle at each joint (e.g., how bent the elbow is) from three connected keypoints.
3. **Match scoring:** the app compares your joint angles to the reference video's joint angles frame-by-frame and converts the average difference into a 0–100% match score.
4. **Timing-aware scoring (DTW):** a hand-written Dynamic Time Warping algorithm compares a rolling window of your recent movement history against the reference's recent history, finding the best alignment between the two sequences even when your timing doesn't exactly match the video's — so the score reflects your technique, not just your timing precision.
5. **Mirroring:** both the webcam feed and its skeleton overlay are flipped horizontally (`scaleX(-1)`) so that turning to your left appears on the left side of your screen too, matching what you'd see in a real mirror.

## Tech Stack

- **Vanilla JavaScript, HTML, CSS** — no framework, kept deliberately lightweight since everything runs client-side in the browser
- **MediaPipe Pose** (Google) — real-time pose estimation
- **Custom DTW implementation** — written from scratch after third-party CDN libraries proved unreliable (see Technical Notes below)
- **Vercel** — deployment and hosting

## Running It Locally

1. Clone the repo:
   ```
   git clone https://github.com/bhumitakrani890-ai/dance-pose-app.git
   ```
2. Open the folder in VS Code
3. Install the "Live Server" extension if you don't have it
4. Right-click `index.html` → "Open with Live Server"
5. Click "Choose File" to upload a dance video, then "Start Camera" to begin

No build step, no npm install required — it's plain HTML/CSS/JS.

## Technical Notes

**Why a hand-written DTW algorithm?** Initially, this project used a third-party `dynamic-time-warping` npm package loaded via CDN. After multiple CDN sources failed to load the library correctly in the browser (`ReferenceError: DynamicTimeWarping is not defined`), I implemented the core DTW algorithm directly — a dynamic programming approach that builds a cost matrix comparing every point in one sequence against every point in another, then finds the cheapest alignment path through that matrix. This removed the external dependency entirely and gave me a deeper understanding of how the algorithm actually works.

**Single-person pose detection:** MediaPipe Pose tracks one person at a time. Reference videos with multiple people in frame will have inconsistent tracking as the model's focus can shift between people; solo dance videos with one performer facing the camera give the most reliable results.

## Future Improvements

- Multi-person pose detection for group choreography videos
- Slow-motion / loop-a-section practice mode
- Per-joint breakdown (e.g., "your right arm is off, everything else matches")
- Session history / progress tracking over multiple practice attempts

## Author

Bhumi Takrani — B.Tech Computer Science (Software Engineering), Vishwakarma Institute of Technology, Pune
[GitHub](https://github.com/bhumitakrani890-ai)
