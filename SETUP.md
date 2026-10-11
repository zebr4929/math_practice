# Precalc Practice: setup guide

Two parts. Part 1 puts the site online (about 10 minutes). Part 2 connects the Google Sheet that records results (about 15 minutes). The site works without Part 2; it just won't record anything.

## Part 1: Put the site on GitHub Pages

1. Sign in at github.com and create a new repository (this one is named `math_practice`).
   - Choose **Public** (GitHub Pages is free for public repositories).
   - Do not add a README. Leave it empty.
2. Upload the files. If Claude pushed them for you, skip this step. Otherwise:
   - On the empty repository page, click **uploading an existing file**.
   - Drag in everything inside the `math_practice` folder (`index.html`, `precalc`, `apps-script`, this file). Keep the folder structure.
   - Click **Commit changes**.
3. Turn on Pages: **Settings > Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**, then **Save**.
4. Wait a minute or two, then refresh. The page shows your link, which will look like `https://YOUR-USERNAME.github.io/math_practice/precalc/`.

Open the link and try a set as a student.

## Part 2: Record results in a Google Sheet

1. Create a new Google Sheet, for example *Precalc Practice Results*.
   - If your school Google account will not let you share a web app with "Anyone" (step 6), use a personal Google account for this sheet instead.
2. In the sheet: **Extensions > Apps Script**.
3. Delete what is in the editor and paste in everything from `apps-script/Code.gs`. Click the save icon.
4. Click **Deploy > New deployment**. Click the gear next to *Select type* and choose **Web app**.
5. Set **Execute as: Me**.
6. Set **Who has access: Anyone**. (Students are not signed in to anything, so the site has to be able to post without a login.)
7. Click **Deploy**, then **Authorize access** and approve the permissions. Google will warn that the app is unverified because you wrote it: click **Advanced**, then **Go to (project name)**.
8. Copy the **Web app URL** (it ends in `/exec`).
9. In GitHub, open `precalc/js/config.js`, click the pencil icon, paste the URL between the quotes on the `sheetUrl` line, and commit.

Test it: finish one set on the site. A new tab named **Log** appears in your sheet with a row for that set. The results screen also says "Result saved for your teacher."

### What gets recorded

One row per practice set, updated after every problem the student checks. The Status column shows "Completed" or, if the student quit partway, "Stopped: 2 of 6". Each row also has the name, teacher, block, skill, level, number correct, number attempted, percent correct, the types of problems missed, and minutes spent. Nothing else about the student is collected.

### If you change Code.gs later

Use **Deploy > Manage deployments**, edit the existing deployment, and choose **New version**. That keeps the same URL, so you don't need to change `config.js`.

## Everyday edits

- **Teachers and class blocks:** edit the `teachers` and `blocks` lists in `precalc/js/config.js`.
- **Problems per set:** edit `problemsPerSet` in `precalc/js/config.js`.
