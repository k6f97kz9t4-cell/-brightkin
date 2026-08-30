# BrightKin

**More good days together.**

BrightKin is a local-first family connection app built to help real people create meaningful experiences, preserve memories, and learn what brings a household closer together.

## What is in this build

- Fresh Joy Mission generation across Laugh, Reconnect, Adventure, Calm, Surprise, Learn, and Celebrate.
- Persistent repeat avoidance so repeated clicks produce materially different activities.
- 1, 2, or 3 ideas per generation, with 1 as the default.
- Household profiles and a private Joy Graph.
- Memory Vault with photo and short-video attachments stored in IndexedDB.
- Story Night and memory transformations with guarded prose composition.
- Celebration planning.
- True seven-day Good Days insights.
- Year in Joy annual keepsake with print/PDF and standalone HTML export.
- Family Share backups with optional AES-GCM passphrase protection and media transfer.
- PWA/offline support designed for iPhone home-screen installation.
- Local-first generation and storage: this GitHub Pages edition does not require a BrightKin backend.

Subscription billing is intentionally not included yet.

## GitHub deployment

This repository is the source of truth. `BrightKin CI` runs the behavioral regression suite, GitHub Pages compatibility suite, and JavaScript syntax checks on pushes to `main` and on pull requests.

BrightKin is intentionally deployable with GitHub Pages' built-in branch publishing, with no Vercel dependency and no custom deployment service required.

One-time repository setting:
1. Open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose **main** and **/(root)**, then save.

After that, every update committed to `main` is automatically published by GitHub Pages. For this repository the Pages address is expected to be:

`https://k6f97kz9t4-cell.github.io/-brightkin/`

## Privacy

BrightKin's GitHub edition keeps generation and family context in the browser. Photos/videos remain on-device unless the user explicitly exports or shares a household backup. BrightKin has no ads, no public family feed, and no engagement-maximizing infinite scroll.
