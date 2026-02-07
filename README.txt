# Sudoku Trainer (Local → Vercel, no Git)

## 1) Install
- Install Node.js (>=18).
- (Optional) `npm i -g vercel`

## 2) Deploy (no Git)
```bash
cd <unzipped-folder>
npm i
npx vercel           # first time: follow prompts, framework Next.js detected
npx vercel env add BASIC_USER   # value: user
npx vercel env add BASIC_PASS   # value: 84930
npx vercel deploy --prod
```

Then open the URL → Basic Auth dialog appears → user / 84930.
The app is static (`public/index.html`) and protected by Edge Middleware (no password in source).
