# Project details

## Goal

Gift approximately ₹10,000 of JUNIORBEES to Sourabh's newborn nephew.

Sourabh will buy the ETF normally in his primary Zerodha demat account. When the nephew's father opens a Zerodha minor account, Sourabh will transfer all JUNIORBEES units directly through Zerodha's gifting flow.

The physical card and website should make the gift personal. The website should remain available permanently as a static family time capsule.

## Current decisions

- Investment: JUNIORBEES.
- The readable website letter is stored only in the ignored local file `private/letter.html` and in Sourabh's private backup.
- Initial owner: Sourabh, through his primary Zerodha demat account.
- Final owner: the nephew, through a guardian-operated Zerodha minor account.
- Guardian control before age 18 is accepted.
- Transfer method: Zerodha's online gifting flow.
- Information needed to initiate the gift: minor's registered name, registered mobile number, and registered email address.
- The website must not collect PAN, Aadhaar, brokerage credentials, or the 16-digit demat ID.
- Hosting direction: GitHub Pages, with a printed fallback URL and an offline ZIP backup.
- The permanent site must not depend on the notification form continuing to work.
- Repository: public GitHub repository named `for-future-you`, owned by `Sourabh8792`.
- Visual direction: raw static-blog layout based on Lossfunk, with a warm Anthropic-style background and minimal rounded treatment only on the gift link.
- Website implementation: static HTML, CSS, and minimal JavaScript with a pinned local copy of libsodium for Argon2id. Nothing loads from a CDN.
- Account-ready action: the encrypted content includes a "Click here for the gift" link that opens the Notion Form in a new tab.
- The Notion URL must exist only inside the encrypted letter payload and private local source.
- Notion Form title: "A small gift for my nephew".

## Work stages

1. Finalise the physical card and website letter.
2. Design the website and the minimal account-ready notification flow.
3. Host on GitHub Pages and test the website, QR code, and notifications.
4. Print the approved message on the front and the QR code plus fallback URL on the back.
5. Put the card in a lifafa marked "From your uncle".

## Print card specification

- Format: A6 portrait, 105 x 148 mm trim size.
- Bleed: 3 mm on every edge.
- PDF: two pages, front and back, with vector text and vector QR code.
- Front copy: "A small gift for your future." and "Stay curious."
- Back copy: "Scan to open your gift.", the QR code, and the full fallback URL.
- QR destination: the permanent GitHub Pages URL, not the Notion Form.
- QR error correction: level Q with a four-module quiet zone.
- Print preview: 300 DPI PNG for each side, cropped to the final A6 trim.

## Website outline

1. A minimal role screen offers mother, father, and "I'm the guy, this gift is for me".
2. Mother and father each receive a date-specific WhatsApp question. The nephew asks either parent to help.
3. A correct answer decrypts the complete letter and Notion gift link locally in the browser.
4. The letter locks again whenever the page is refreshed or reopened.

The website does not explain the ETF, purchase, transfer process, or intended audience. Those details belong in the Notion Form.

## Transfer flow

1. The nephew's father opens the Zerodha minor account.
2. He sends the minor's registered name, mobile number, and email address.
3. Sourabh initiates the JUNIORBEES gift from Kite.
4. The father accepts the gift using the minor account credentials within seven days.
5. Sourabh completes the CDSL TPIN, beneficiary verification, and final OTP.

## Open questions

- Should the site use the nephew's first name?
- Will a custom domain be added later, or will the GitHub Pages URL remain canonical?

## Private letter gate

- The public landing screen will offer three roles: mother, father, and "I'm the guy, this gift is for me".
- Father's question will ask for Sourabh's first WhatsApp message on 13 June 2026.
- Mother's question will ask for Sourabh's first WhatsApp message on 27 March 2026.
- The question asks for the first message from the personal WhatsApp chat, uses "copy-paste", and bolds "exact".
- The nephew will unlock the letter using either parent's answer, with their help.
- Only the question dates may be committed. The answers and derived keys must never be stored in the repository, documentation, tests, or build logs.
- The answer is normalized with Unicode NFC and outside whitespace is removed. Capitalisation, internal text, and punctuation remain exact.
- Argon2id derives a 256-bit key using 64 MiB memory and three passes.
- AES-256-GCM encrypts and authenticates two separate copies of the same letter using independent salts and nonces.
- GitHub serves only the public gate, local cryptography code, and encrypted payloads. Encryption is created locally and decryption runs only in the visitor's browser.
