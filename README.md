# Newborn ETF Gift

A small project to gift JUNIORBEES to Sourabh's newborn nephew and preserve the story through a physical card and permanent website.

Current status: the physical card is complete. The website uses a private, two-key letter gate built with Argon2id and AES-256-GCM.

The project source of truth is [docs/project.md](docs/project.md).

## Local preview

Install the pinned development dependency and run a static server:

```sh
npm install
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Create the encrypted letters

The readable letter exists only in the ignored local file `private/letter.html`. Never add that directory to Git.

Run this command in an interactive Terminal window:

```sh
npm run encrypt
```

Paste each parent's WhatsApp message twice when prompted. The input remains hidden. The command writes and self-verifies `encrypted/mother.json` and `encrypted/father.json` without saving either answer.

## Tests

```sh
npm test
npm run verify:publish
```

## Print card

Install `requirements-print.txt`, make sure Poppler's `pdftoppm` is available, then run:

```sh
python3 scripts/generate_card.py
```

The print-ready card and previews are written to `output/pdf/`.
