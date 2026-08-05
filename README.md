
## Prototype authentication (IMPORTANT)

This project contains a client-side prototype authentication system that stores account credentials locally in your browser (IndexedDB). It uses PBKDF2 (SHA-256) with a random 16-byte salt and 150k iterations to derive a password key, but this is NOT a replacement for a secure server-side authentication system.

Warnings:

- Accounts and credentials are stored only in the user's browser (IndexedDB). If a user clears their browser data, accounts are lost.
- Do NOT reuse passwords you use elsewhere.
- This is a prototype for convenience only. If you need server-side persistence, implement a secure backend with HTTPS and proper password hashing/salting (Argon2/scrypt or PBKDF2 with server-side salts and slow parameters), and never store plaintext passwords in the repository.

