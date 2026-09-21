# Frontend: AI Content Moderation Dashboard

Modern React dashboard built with Vite and Tailwind CSS for real-time comment moderation, multi-label toxicity visualization, severity analysis, and audit history browsing.

## Features
- **Moderation Studio**: Interactive comment analyzer with 1-click test presets, live character count, and custom threshold override.
- **Severity & Action Banner**: Prominent visual indicators for recommended actions (`ALLOW`, `CENSOR`, `HIDE`, `FLAG`, `DELETE`) and severity score percentage.
- **6 Toxicity Cards**: Individual progress bars and detection status for `toxic`, `severe_toxic`, `obscene`, `threat`, `insult`, and `identity_hate`.
- **Censored Output View**: Side-by-side comparison of original vs safe masked text when `CENSOR` action is triggered.
- **Analytics Dashboard**: Real-time KPI cards, label frequency distribution bars, and action/severity breakdown meters.
- **Audit History**: Searchable compliance table with filtering by severity and action, pagination, and full detail modal.

## Quickstart

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
