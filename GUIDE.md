# 🐛 How to Run This Project — Simple Step-by-Step Guide

This guide is for a teammate who just got the code from GitHub and wants to run the
Smart Pest Detection chatbot on their own computer. It's written to be **super easy** —
just follow each step in order and copy-paste the commands. 🙂

The app has **two parts** that run at the same time:
1. **Backend** (the "brain" — recognises the bug and knows the treatments) → Python
2. **Frontend** (the "face" — the website you click on) → Node.js

You'll open **two terminal windows** and keep both running. That's normal!

---

## ✅ Part 0 — Install 3 tools (one time only)

Before anything, install these three programs. Just click Next/Install like any normal app.

| Tool | Why you need it | Where to get it |
|------|-----------------|-----------------|
| **Git** | to download the code | https://git-scm.com/download/win |
| **Python 3.12** | runs the backend "brain" | https://www.python.org/downloads/release/python-3120/ |
| **Node.js (LTS)** | runs the website | https://nodejs.org (get the "LTS" button) |

> 🚨 **VERY IMPORTANT for Python:** On the first screen of the Python installer,
> tick the box **"Add python.exe to PATH"** at the bottom, THEN click Install.
> If you forget this, the commands later won't work.

> ℹ️ **Note:** We use **Python 3.12** on purpose. Newer versions (like 3.13 or 3.14)
> can't run TensorFlow, which the brain needs. 3.12 is the safe choice.

After installing, **close and reopen** any terminal windows so the computer notices
the new tools.

---

## ✅ Part 1 — Download the code from GitHub

Open **PowerShell** (press the Windows key, type `PowerShell`, press Enter) and run:

```powershell
cd Desktop
git clone <PASTE-THE-GITHUB-LINK-HERE>
cd crop-bug-identify
```

> Replace `<PASTE-THE-GITHUB-LINK-HERE>` with the link your teammate gives you
> (it looks like `https://github.com/username/crop-bug-identify.git`).

Now you have a folder called `crop-bug-identify` with all the code inside. 🎉

---

## ✅ Part 2 — Check the "brain" model is there

The app uses a trained AI model file. Check it exists:

```powershell
dir backend\model
```

You should see a file named **`pest_model.keras`** (about 28 MB).

- ✅ **If you see it** → great, skip to Part 3.
- ❌ **If it's NOT there** → ask your teammate to send you the `pest_model.keras` file,
  and put it inside the `backend\model` folder. (Without it, the app still runs but
  it will *guess randomly* instead of really recognising the bug.)

---

## ✅ Part 3 — Start the Backend (the brain) 🧠

In the same PowerShell window, run:

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File .\run_real_model.ps1
```

**What happens now:**
- The **first time**, it sets everything up and downloads TensorFlow.
  ⏳ This takes a few minutes — grab a snack, it's normal! Don't close the window.
- **Every time after**, it starts in a few seconds.

When it's ready, you'll see a line like:

```
Starting backend with the real model on http://localhost:5000 ...
```

**✅ Check it worked:** open your web browser and go to
👉 **http://localhost:5000/api/health**

You should see some text that includes `"model": "trained"`.
- `"model": "trained"` = 🎉 the real AI is working!
- `"model": "mock"` = the model file is missing (go back to Part 2).

> 🛑 **Leave this window open!** If you close it, the brain turns off.

---

## ✅ Part 4 — Start the Frontend (the website) 🌐

**Open a SECOND PowerShell window** (keep the first one running!).

Go to the project's frontend folder and start it. In the new window:

```powershell
cd Desktop\crop-bug-identify\frontend
npm install
npm run dev
```

- `npm install` downloads the website's building blocks (first time only, ~1 minute).
- `npm run dev` starts the website.

When it's ready you'll see a link like:

```
  ➜  Local:   http://localhost:5173/
```

---

## ✅ Part 5 — Open the app and play! 🎈

Open your browser and go to 👉 **http://localhost:5173**

You'll see the pest chatbot. Now try it:
1. Click the **📷 camera button**.
2. Choose a photo of a bug (grasshopper, snail, beetle, etc.).
3. Click **Send**.
4. The bot tells you what bug it is and how to deal with it! 🐛✨

Try a blurry or unrelated photo too — the bot is honest and says
"I'm not fully sure..." with its best guesses instead of making things up.

---

## 🎁 Optional — Smarter chatbot replies

The chatbot works fully on its own. But if you want it to write friendlier,
more conversational answers, you can add a **free** Google Gemini key:

1. Get a free key from https://aistudio.google.com/app/apikey
2. In the `backend` folder, make a copy of `.env.example` and name it `.env`:
   ```powershell
   cd backend
   copy .env.example .env
   ```
3. Open `.env` in Notepad and paste your key after `GEMINI_API_KEY=`
4. Restart the backend (close the backend window, run Part 3 again).

Without a key, everything still works — answers just come straight from our pest
knowledge book instead. 👍

---

## 🆘 If something goes wrong

| Problem | Fix |
|---------|-----|
| `git` / `python` / `npm` "not recognised" | You missed installing that tool, or forgot to reopen PowerShell. Close it and open a fresh window. |
| Backend says **"Python 3.12 not found"** | Reinstall Python 3.12 and tick **"Add python.exe to PATH"**. Then reopen PowerShell. |
| Health page shows `"model": "mock"` | The `pest_model.keras` file is missing → see Part 2. |
| Website loads but bot says "detection failed" | The backend window isn't running. Do Part 3 again and keep it open. |
| Port already in use / weird errors | Close both windows and start over from Part 3. |

---

## 📋 Quick summary (once everything is installed)

**Window 1 — Backend:**
```powershell
cd Desktop\crop-bug-identify\backend
powershell -ExecutionPolicy Bypass -File .\run_real_model.ps1
```

**Window 2 — Frontend:**
```powershell
cd Desktop\crop-bug-identify\frontend
npm run dev
```

**Then open:** http://localhost:5173 🎉
