<p align="center">
	<img src="public/logo.png" alt="Tayri Motion" width="180" />
</p>

# Tayri Motion

**Next.js** application dedicated to **blob detection, tracking, and video export**
(zones / objects) in visual sequences, featuring a modern and interactive interface.

## Features

- Blob detection & tracking (dedicated pipeline)
- Interactive control panels (parameters, thresholds, display options)
- Video playback & render export
- Dedicated pages: Home, Live, Tracking, Changelog

## Tech Stack

- **Next.js 16 / React 19**
- **Three.js** (canvas & visualization)
- **Sass / GSAP** (UI & animations)
- **Tweakpane** (controls)
- **ESLint**

## Quick Start

```bash
npm install
npm run dev
```

Open :  
http://localhost:3000

## Project Structure

```
src/
 ├─ components/      # UI & controls
 ├─ pages/           # Live, Tracking, Changelog
 ├─ utils/           # Detection, tracking, video export
 ├─ contexts/        # Thème, loader
 └─ styles/          # Sass
```

## Licence

This project is licensed under the GNU General Public License v3.0.
See the [LICENSE](LICENSE) file for more information.
