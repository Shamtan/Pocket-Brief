# Deploying Pocket Brief on Railway

Railway builds the `Dockerfile` in this repo and runs it. The image is Caddy serving two folders:

| Path in the image | From the repo | What it is |
|---|---|---|
| `/srv/index.html` | `web/index.html` | The brief (v0 prototype; the React build replaces it later) |
| `/srv/data/` | `data/` | Country data, map outline and photos: the single source of truth |

`railway.json` tells Railway to build the Dockerfile and health-check `/healthz`.

## One-time setup (Railway dashboard, about five minutes)

1. Go to **railway.com → New Project → Deploy from GitHub repo**, allow access to `Shamtan/Pocket-Brief`, and pick it.
2. **Branch.** In the service's **Settings → Source**, choose the branch to deploy:
   - `main` for the live brief (merge the open pull request first), or
   - `claude/ecstatic-maxwell-dosgxo` to preview the work in progress now.
3. **Login (recommended before sharing the link).** In **Variables**, add:
   - `BASIC_AUTH_USER` = a user name
   - `BASIC_AUTH_PASSWORD` = a strong password

   The container hashes the password at startup and the browser asks for it on first visit. Without
   these two variables the site is open to anyone who has the link.
4. **Address.** In **Settings → Networking**, click **Generate Domain**. Railway gives a
   `*.up.railway.app` link that works on desktop and phone.
5. **Optional:** in **Settings → Environments**, turn on **PR Environments** so every pull request gets
   its own preview link.

After that, every push to the chosen branch redeploys automatically. Railway injects `PORT`; nothing
else needs configuring.

## What the server does

- Serves the brief with security headers (no framing, no search-engine indexing, a content security
  policy that only allows this site plus Google Fonts).
- Sends `no-cache` for the page and data, so a new research sweep shows up on the next load; photos
  are cached for a week.
- Answers `/healthz` without the login so Railway's health check passes.

## Test locally

```sh
docker build -t pocket-brief .
docker run --rm -p 8080:8080 pocket-brief                                     # open
docker run --rm -p 8080:8080 -e BASIC_AUTH_USER=ireo -e BASIC_AUTH_PASSWORD=change-me pocket-brief   # with login
```

Then open http://localhost:8080.

## Keep out of git

Passwords and tokens live only in Railway's **Variables**. Never commit them.
