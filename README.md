# PSHS Demonlist

A community-driven Geometry Dash Demonlist built for PSHS players.

The project provides a modern web interface for browsing ranked demons, viewing level information, and submitting records or level proposals for moderator review.

## Features

- View ranked demons with difficulty, creator, points, and victor information
- Search demons by name, creator, or difficulty
- Open detailed level pages directly from the list
- Submit completion records for existing list demons
- Propose new demons for consideration
- Responsive interface with light and dark theme support
- Google Apps Script–powered submission pipeline for moderation workflows

## Architecture

The project is a static frontend hosted on GitHub Pages.

```text
Browser
   │
   ├── Loads level data from JSON files
   │
   └── Sends submissions to Google Apps Script
            │
            └── Moderator review workflow
```

### Core Files

```text
pshs-demonlist/
│
├─ index.html        # Main application interface
├─ main.js           # Frontend logic, rendering, search, and submissions
├─ levels.json       # Demon list data
├─ pending.json      # Legacy/local queue data (if present)
├─ assets/           # Images and supporting assets
└─ README.md
```

## Running Locally

1. Clone the repository.
2. Open `index.html` in a modern browser.
3. Ensure `levels.json` is present and properly formatted.
4. Test submissions using the configured Apps Script backend.

## Data Management

### Updating the Demon List

Most list changes are performed by editing `levels.json`.

Recommended fields:

```json
{
  "rank": 1,
  "name": "Example Demon",
  "creator": "Creator",
  "id": "123456",
  "diff": "Extreme Demon",
  "victorList": []
}
```

### Submission Flow

User submissions are sent to a Google Apps Script endpoint and reviewed before being incorporated into the list.

Because client-side validation can be bypassed, moderation and validation should always occur on the backend.

## Contributing

Contributions are welcome.

When submitting changes:

- Keep list data consistent and properly ranked.
- Preserve unique level IDs.
- Test search and level navigation functionality.
- Update documentation when architecture or workflows change.

## Security

If you discover a security issue, please follow the instructions in `SECURITY.md`.

Do not publicly disclose vulnerabilities until they have been reviewed.

## License

This repository is maintained for the PSHS Geometry Dash community.