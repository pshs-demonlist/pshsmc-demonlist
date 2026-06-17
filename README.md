# PSHS Demonlist

A fully online, dynamic Geometry Dash Demonlist for PSHS players.

Track the top demons, submit records, or propose new levels—all directly through the website.

## Features

- 🔥 View all current demons with rank, creator, points, and difficulty
- 🎯 Submit a record for an existing demon
- ✨ Propose a new level with name, creator, difficulty, points, and thumbnail
- 🔍 Search demons by name, creator, or difficulty
- ✅ Pending submissions automatically added to a queue for review

## Repository Structure

```text
pshs-demonlist/
│
├─ index.html          # Main page with list & submission form
├─ level.html          # Optional page for individual level details
├─ styles.css          # CSS styling for layout & theme
├─ main.js             # JS logic: rendering, submissions, search
├─ levels.json         # Current demons
├─ pending.json        # Submissions queue
├─ thumbnails/         # Optional folder for images
└─ README.md           # This file
```

## How to Use

1. Clone or download the repository.
2. Open `index.html` in a browser (works best in Chrome, Brave, or Edge).
3. Browse demons or submit a record/new level.
4. All submissions are saved to `pending.json` and visible in the queue.

## Contributing

- To add or edit demons, update `levels.json`.
- Submissions are automatically added to `pending.json`.
- Please don't modify `main.js` unless you know what you're doing—it handles the website logic.

## Notes

The site can be hosted via GitHub Pages:

```text
https://pshs-demonlist.github.io/pshs-mcdemonlist/
```

No external services are required—all data is stored inside the repository.

## License

This project is intended for use by the PSHS Geometry Dash community.
