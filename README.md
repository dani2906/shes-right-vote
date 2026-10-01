# She's Right · Design vote

A one-page vote on six versions of the She's Right "Today" screen (sunny day).

Live at **https://dani2906.github.io/shes-right-vote/**

- Voters tap the screens in order, favorite first, then press **Submit my vote**.
- Votes land in a private Google Sheet, one row per voter. Voting again from the same browser replaces that voter's row.
- Live results (points, average place, first-place picks, and every voter's ranking and note):
  `https://dani2906.github.io/shes-right-vote/?results=YOUR_KEY`

The page is connected to the sheet. **Copy my ranking** stays available as a backup.

## Connect the Google Sheet (one time)

1. Create a new Google Sheet, for example "She's Right votes".
2. In the sheet, open **Extensions → Apps Script**.
3. Delete what's in `Code.gs` and paste in [`apps-script/Code.gs`](apps-script/Code.gs).
4. Change `RESULTS_KEY` at the top to your own secret. Keep it out of this repo.
5. Click **Deploy → New deployment**, pick type **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Click **Deploy**, approve the Google permissions prompt, and copy the **Web app URL** (it ends in `/exec`).
7. Put that URL into `SHEET_URL` in `index.html` (Claude can do this for you).

The script only writes to its own spreadsheet. It needs "Anyone" access so voters can submit without signing in, and it only returns votes when given the right `RESULTS_KEY`.

**Changing the script later:** use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.

## Points

6 points for 1st place down to 1 for 6th. Ties are broken by number of 1st-place picks.

| Letter | Design |
|---|---|
| O | Original |
| A | Morning paper |
| B | Game day |
| C | The dot |
| D | Weather app |
| E | Field brief |
