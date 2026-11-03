# 🏛️ Mi TV Cinematic Launcher

> A next-generation, cinematic Smart TV launcher built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. Features a dual-video scrubbing engine with a curved 3D holographic application carousel, authentic vector brand logos, full TV remote navigation, and a dynamic App Manager.

---

## ✨ Features

- **🎬 Interactive Dual-Video Scrubbing Engine:**
  - Synchronizes the character's hand sweeps with forward (`main_intra.mp4`) and backward (`backward_intra_1080p.mp4`) transitions.
  - Zero black frames or buffering glitch using intra-frame keyframed derivative videos and high-res poster fallback.
- **🌐 3D Cylindrical Curved Holographic Arc:**
  - Mathematical trigonometric positioning (`x = radius * sin(θ)`, `z = -depth * (1 - cos(θ))`) matching the video's curved holographic halo.
  - Tangent Y-axis rotation and depth receding for realistic curved TV screen perspective.
- **🏷️ Authentic Real Brand Logos:**
  - Legitimate vector logos loaded from `public/assets/app-logos/` (YouTube, Netflix, Prime Video, Spotify, YouTube Music, Google Play Games, Settings, My Apps, Disney+, Twitch, Web Browser).
  - High-contrast solid panel backings preserving the cyan/gold holographic aesthetic while keeping brand colors vivid from normal TV viewing distances.
- **🎮 Complete Smart TV Remote Navigation:**
  - Full directional D-Pad support (`◀`, `▶`, `▲`, `▼`), `OK / ENTER` launch, `BACK / ESC` return.
  - Real-time sound synthesis via Web Audio API (nav clicks, selection chime, edge bump).
- **🛠️ Built-in App Manager & Customization:**
  - Add, edit, reorder, or enable/disable installed apps.
  - Live logo preview and preset selector with support for custom SVG/PNG asset paths.
  - Native Android TV package IDs (`com.google.android.youtube.tv`, `com.netflix.ninja`) and Web URL destinations.
- **📺 Universal 16:9 Cinema Container:**
  - Locked aspect-ratio container ensuring video backgrounds and card overlays never drift across 1080p, 4K, ultra-wide, or mobile screens.

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have **Node.js 18+** installed:
```bash
node -v
npm -v
```

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/mi-tv-cinematic-launcher.git

# Navigate into the project folder
cd mi-tv-cinematic-launcher

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The launcher will start and bind to both **localhost** and your **Local Wi-Fi Network**:
- **Local Browser:** `http://localhost:5173/`
- **Smart TV / Mobile on Local Wi-Fi:** `http://192.168.x.x:5173/` (e.g. `http://192.168.1.22:5173/`)

---

## 📺 How to Open on Smart TV / Mobile

1. Make sure your **Smart TV** (or mobile phone/tablet) is connected to the **same Wi-Fi network** as your computer.
2. In the terminal where `npm run dev` is running, note the **Network URL** (e.g., `http://192.168.1.22:5173/`).
3. Open the built-in browser (or TV Web Browser / Chrome) on your Smart TV and enter:
   ```
   http://192.168.1.22:5173/
   ```
4. Use your TV remote's D-pad to control the cinematic launcher!

---

## 🎮 Remote & Keyboard Controls

| Action | TV Remote Key | Keyboard Key | Description |
|---|---|---|---|
| **Navigate Left** | `◀ Left Arrow` | `ArrowLeft` / `A` | Move to previous app; plays backward video sweep |
| **Navigate Right** | `▶ Right Arrow` | `ArrowRight` / `D` | Move to next app; plays forward video sweep |
| **Switch Row** | `▲ / ▼ Up / Down` | `ArrowUp` / `ArrowDown` | Switch focus between Top Bar, App Carousel, and Bottom Bar |
| **Launch App** | `OK / SELECT` | `Enter` / `Space` | Launch focused app / trigger hand touch animation |
| **Return / Close** | `BACK` | `Escape` / `Backspace` | Close App Manager or Settings dialog |
| **Home** | `HOME` | `Home` | Return to default center app |

---

## 📁 Project Architecture

```
ui-for-tv/
├── public/
│   ├── assets/
│   │   └── app-logos/          # Authentic vector SVG logos (YouTube, Netflix, Prime, Spotify, etc.)
│   ├── images/
│   │   └── launcher-background.png  # Instant zero-flicker background poster
│   └── video/
│       ├── main_intra.mp4      # Intra-keyframe forward scrubbing video
│       ├── backward_intra_1080p.mp4 # Backward scrubbing video
│       ├── app-navigation.mp4  # Original forward reference video
│       └── backward-navigation.mp4 # Original backward reference video
├── src/
│   ├── components/
│   │   ├── AppCarousel.tsx     # 3D Curved Cylindrical Carousel & card panels
│   │   ├── AppIcon.tsx         # Real logo renderer with contrast badge
│   │   ├── AppManager.tsx      # Modal to add/edit/reorder apps and pick logos
│   │   ├── CinematicBackground.tsx # Dual-video playback & poster fallback
│   │   ├── HomeScreen.tsx      # TV HUD, clock, remote guide & status bar
│   │   └── SettingsModal.tsx   # Scrub mode, sound, and wrap-around toggles
│   ├── config/
│   │   ├── arcCarouselConfig.ts # Trigonometric 3D arc mathematics & parameters
│   │   ├── hologramAnchors.ts  # Calibrated slot metrics for 16:9 container
│   │   ├── timeline.json       # Precise video rest frames and step timestamps
│   │   └── videoScrubbing.ts   # Video engine settings & source configuration
│   ├── data/
│   │   └── defaultApps.ts      # Initial 8 default apps with real logo paths
│   ├── hooks/
│   │   ├── useAppStorage.ts    # LocalStorage persistence & auto-migration
│   │   ├── useTVRemote.ts      # D-Pad keyboard & TV remote event listener
│   │   └── useVideoScrubbing.ts# Frame-accurate video seek and step logic
│   ├── types/
│   │   └── app.ts              # TypeScript interfaces for apps, state & rows
│   ├── App.tsx                 # Root launcher application & 16:9 container
│   └── main.tsx                # React root entry point
├── package.json                # Project dependencies & scripts
├── tailwind.config.js          # Tailwind CSS styling configuration
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration with host: true enabled
```

---

## 📤 Upload to GitHub (Step-by-Step)

To upload this project to your GitHub account:

### 1. Stage all prepared files:
```bash
git add .
```

### 2. Create the initial commit:
```bash
git commit -m "feat: Mi TV cinematic launcher with curved 3D carousel and real app logos"
```

### 3. Set default branch to `main`:
```bash
git branch -M main
```

### 4. Link your GitHub repository:
Create a new repository on [GitHub](https://github.com/new) (e.g. named `mi-tv-cinematic-launcher`), then run:
```bash
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
```

### 5. Push code to GitHub:
```bash
git push -u origin main
```

---

## 🛠️ Build for Production
To build optimized static assets:
```bash
npm run build
```
The output will be generated inside the `dist/` directory, ready to be hosted on any web server or packaged into an Android TV WebView / Capacitor container.

