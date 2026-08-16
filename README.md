# Laraib — Portfolio (DecodeLabs Training Project)

A single-page portfolio for Laraib — WordPress developer, Live2D rigger, 3D
visualizer, video editor, designer, and entrepreneur — built to satisfy all
three DecodeLabs training milestones:

- **Project 1 — Responsive Frontend Interface**: mobile-first HTML5/CSS3/vanilla
  JS, zero frameworks, warm 2025 aesthetic (Mocha Mousse / Ethereal Blue /
  Moonlit Grey), semantic landmarks, CSS Grid + Flexbox.
- **Project 2 & 3 — Backend API & Database**: a full CRUD **Guestbook / Comment
  Section** built into the site footer, backed by PHP + MySQL, using prepared
  statements throughout to prevent SQL injection. Deployable on InfinityFree's
  shared hosting.

Design system: **Warmth & Grounding** — Mocha Mousse `#A67B5B` (stability),
Ethereal Blue `#A7D0ED` (trust), Moonlit Grey `#F2F0EA` (refinement). Headlines
in Montserrat, body text in Roboto.

---

## Repo Structure

```
decodelabs-portfolio/
├── frontend/
│   ├── index.html            # semantic HTML5 markup (incl. footer guestbook)
│   ├── css/
│   │   └── style.css         # all styling — Grid/Flexbox, responsive breakpoints
│   └── js/
│       └── script.js         # nav, animations, Hire Me form, guestbook CRUD
├── backend/
│   └── api/
│       ├── config.sample.php # credential TEMPLATE — safe to commit
│       ├── config.php        # your REAL credentials — gitignored, never committed
│       ├── db.php            # PDO connection (parameterized queries)
│       ├── bootstrap.php     # shared headers, CORS, JSON helpers
│       ├── comments_create.php   # CREATE  (POST)
│       ├── comments_read.php     # READ    (GET)
│       ├── comments_update.php   # UPDATE  (POST)
│       ├── comments_delete.php   # DELETE  (POST)
│       └── contact_create.php    # Hire Me form submission (POST)
├── database/
│   └── schema.sql            # CREATE TABLE statements
├── .gitignore
└── README.md
```

**Why the split?** `frontend/` is pure static assets — this is what you'll
FTP/copy into InfinityFree's `htdocs/` root. `backend/api/` holds every PHP
script — you'll upload this as `htdocs/api/` (a sibling folder to `index.html`)
so the frontend's relative `fetch('api/...')` calls resolve correctly.
`database/` never gets uploaded via FTP at all — it's imported once through
phpMyAdmin.

---

## How the Guestbook Works (CRUD)

The footer includes a **Leave a Note** form and a list of existing comments.

| Operation | Endpoint | Method |
|---|---|---|
| Create | `api/comments_create.php` | `POST` |
| Read | `api/comments_read.php` | `GET` |
| Update | `api/comments_update.php` | `POST` |
| Delete | `api/comments_delete.php` | `POST` |

> Plain `POST` is used for update/delete instead of `PUT`/`DELETE` because
> some shared hosts (InfinityFree included) can block non-standard HTTP verbs
> at the server/firewall level. Using `POST` everywhere keeps it portable.

**Ownership without a login system**: when a comment is created, the server
generates a random `edit_token` and returns it **once**, in the create
response only. The browser stores `{ commentId: editToken }` in
`localStorage`. Edit/Delete buttons only render for comments whose id exists
in that local map, and the server re-checks the token against the database
before allowing an update or delete. The token is never included in the
`GET /api/comments_read.php` response, so no other visitor can see or reuse it.

Every input is checked in two passes on the server:

1. **Syntactic** — right type, not empty.
2. **Semantic** — right shape/length (e.g. comment between 2–1000 characters,
   email matches a valid pattern).

All database access goes through **PDO prepared statements** with bound
parameters — user input is never concatenated into SQL, which is what
prevents SQL injection.

---

## Securing Your Database Credentials

1. `backend/api/config.sample.php` is committed to git as a **template** —
   it contains placeholder values only.
2. Copy it locally and rename the copy to `config.php`:
   ```bash
   cp backend/api/config.sample.php backend/api/config.php
   ```
3. Edit `backend/api/config.php` with your real InfinityFree MySQL host,
   database name, username, and password (found in the InfinityFree client
   area under **MySQL Databases**).
4. `backend/api/config.php` is listed in `.gitignore`, so `git status` will
   never show it as a file to commit — it physically cannot leak to GitHub
   as long as you don't force-add it.
5. On the server, `config.php` gets uploaded **directly via FTP**, completely
   separate from your `git push`. Nobody who clones your GitHub repo — including
   your DecodeLabs evaluators — will ever see your real credentials.

---

## Local Development

You need PHP installed (with the `pdo_mysql` extension, on by default) and a
local MySQL server (e.g. via XAMPP/MAMP/Laragon), or you can develop against
your live InfinityFree database directly once it exists.

```bash
# from the project root
cd backend/api
cp config.sample.php config.php     # then edit config.php with real values

cd ../../frontend
php -S localhost:8000 -t .          # serves frontend/ at http://localhost:8000
```

Since `API_BASE = 'api'` in `script.js` is a **relative** path, the API calls
only resolve if `api/` sits next to `index.html`. For local testing, either:

- symlink/copy `backend/api` into `frontend/api`, **or**
- run PHP's built-in server from the project root instead so both
  `frontend/` and `backend/` are reachable, and adjust `API_BASE` to
  `'../backend/api'` temporarily.

The simplest path is usually to test directly against your InfinityFree
staging setup once Step 1 below is done, since that mirrors production exactly.

---

## Deployment Guide

### Step 1 — Create the MySQL Database on InfinityFree

1. Log into your InfinityFree client area and open your hosting account.
2. Go to **MySQL Databases**, create a new database. Note the auto-generated
   database name, username, password, and hostname (usually `sqlXXX.infinityfree.com`).
3. Click **phpMyAdmin** next to your new database.
4. Go to the **Import** tab, choose `database/schema.sql` from this repo, and
   run the import. You should see the `comments` and `contact_submissions`
   tables appear.

### Step 2 — Configure Credentials

1. On your machine, copy `backend/api/config.sample.php` to
   `backend/api/config.php` and fill in the values from Step 1.
2. Double-check `backend/api/config.php` is **not** tracked by git:
   ```bash
   git status   # config.php should NOT appear in the list
   ```

### Step 3 — Upload to InfinityFree (FTP)

InfinityFree deploys via FTP, not git, so this step is separate from GitHub.

1. In the InfinityFree client area, find your FTP credentials (**Accounts →
   FTP Accounts**).
2. Connect with an FTP client (e.g. FileZilla) to your account.
3. Upload so the **remote** `htdocs/` folder ends up looking like this:
   ```
   htdocs/
   ├── index.html
   ├── css/style.css
   ├── js/script.js
   └── api/
       ├── config.php          (uploaded from your local machine, not from git)
       ├── db.php
       ├── bootstrap.php
       ├── comments_create.php
       ├── comments_read.php
       ├── comments_update.php
       ├── comments_delete.php
       └── contact_create.php
   ```
   In practice: upload everything **inside** `frontend/` to `htdocs/`, and
   everything inside `backend/api/` to `htdocs/api/`.
4. Visit your InfinityFree URL (e.g. `https://yoursite.infinityfreeapp.com`)
   and confirm the site loads and the guestbook shows "No comments yet."
5. Post a test comment to confirm the full Create → Read round trip, then
   edit and delete it to confirm Update/Delete work too.

### Step 4 — Push the Code to GitHub (for evaluation)

Since `config.php` is gitignored, it's safe to push the whole repo as-is —
your real credentials stay only on your machine and on the InfinityFree server.

```bash
# 1. Initialize git in your project root (skip if already a repo)
cd decodelabs-portfolio
git init

# 2. Confirm config.php is ignored before you add anything
git status
# config.php should NOT be listed under "Untracked files"

# 3. Stage everything
git add .

# 4. Commit
git commit -m "Add responsive frontend and PHP/MySQL guestbook CRUD API"

# 5. Create a new empty repository on GitHub (via github.com), then link it
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Rename your default branch to main (if it isn't already)
git branch -M main

# 7. Push
git push -u origin main
```

For any future changes:

```bash
git add .
git commit -m "Describe what changed"
git push
```

---

## API Reference

Base URL (local): `http://localhost:8000/api`
Base URL (production): `https://yoursite.infinityfreeapp.com/api`

### `POST /comments_create.php`

**Request body**
```json
{ "name": "Ayesha", "comment": "Loved the Live2D rigs!" }
```

**201 Created**
```json
{
  "status": "success",
  "message": "Comment posted!",
  "data": {
    "id": 12,
    "name": "Ayesha",
    "comment": "Loved the Live2D rigs!",
    "edit_token": "9f2b1c...redacted...",
    "created_at": "2026-08-14T10:15:00+00:00"
  }
}
```

**400 Bad Request**
```json
{ "status": "error", "message": "Comment must be between 2 and 1000 characters." }
```

### `GET /comments_read.php`

**200 OK**
```json
{
  "status": "success",
  "count": 1,
  "data": [
    {
      "id": 12,
      "name": "Ayesha",
      "comment": "Loved the Live2D rigs!",
      "created_at": "2026-08-14 10:15:00",
      "updated_at": "2026-08-14 10:15:00"
    }
  ]
}
```

### `POST /comments_update.php`

**Request body**
```json
{ "id": 12, "edit_token": "9f2b1c...", "comment": "Loved the Live2D rigs — especially the alien one!" }
```

**200 OK**
```json
{ "status": "success", "message": "Comment updated." }
```

**403 Forbidden** (wrong or missing token)
```json
{ "status": "error", "message": "You can only edit your own comment." }
```

### `POST /comments_delete.php`

**Request body**
```json
{ "id": 12, "edit_token": "9f2b1c..." }
```

**200 OK**
```json
{ "status": "success", "message": "Comment deleted." }
```

### `POST /contact_create.php`

Powers the Hire Me form.

**Request body**
```json
{ "name": "Ayesha Khan", "email": "ayesha@example.com", "message": "I'd like a quote for a WordPress site." }
```

**201 Created**
```json
{ "status": "success", "message": "Thanks, Ayesha Khan! Your message is in — I'll reply soon." }
```

---

## Security Notes

- **SQL injection**: every query uses PDO prepared statements with bound
  `:named` parameters — user input is data, never part of the SQL string.
- **Credential safety**: real DB credentials live only in `backend/api/config.php`,
  which is gitignored and uploaded to the server by FTP, never by git.
- **Input validation**: every endpoint checks type, presence, and
  length/format (syntactic + semantic) before touching the database.
- **XSS mitigation**: `strip_tags()` removes HTML on the way in server-side;
  the frontend also escapes comment text before inserting it into the DOM.
- **Ownership without accounts**: the `edit_token` pattern lets the guestbook
  support Update/Delete without building a full authentication system, while
  still requiring server-side proof of ownership for every write.

---

## Credits

Built by Laraib for the DecodeLabs internship program 2026.
