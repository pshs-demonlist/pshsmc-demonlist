PSHS Demonlist

A fully online, dynamic Geometry Dash Demonlist for PSHS players.
Track the top demons, submit records, or propose new levels—all directly through the website.

Features
🔥 View all current demons with rank, creator, points, and difficulty
🎯 Submit a record for an existing demon
✨ Propose a new level with name, creator, difficulty, points, and thumbnail
🔍 Search demons by name, creator, or difficulty
✅ Pending submissions automatically added to a queue for review
Repo Structure
pshs-demonlist/
│
├─ index.html          # Main page with list & submission form
├─ level.html          # Optional page for individual level details
├─ styles.css          # CSS styling for layout & theme
├─ main.js             # JS logic: rendering, submissions, search
├─ levels.json         # Current demons (7 levels included)
├─ pending.json        # Submissions queue
├─ thumbnails/         # Optional folder for images
└─ README.md           # This file
How to Use
Clone or download the repository.
Open index.html in a browser (works best in Chrome, Brave, or Edge).
Browse demons or submit a record / new level.
All submissions are saved to pending.json and visible in the queue.
Contributing
To add or edit demons, update levels.json.
Submissions are automatically added to pending.json.
Please don’t modify main.js unless you know what you’re doing—it handles the website logic.
Notes
The site is fully online via GitHub Pages:
https://YOUR_USERNAME.github.io/pshs-demonlist/
No external services are required—all data is inside the repo.
