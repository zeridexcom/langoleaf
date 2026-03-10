# Deployment Fix TODO

- [x] Identify root cause from Vercel logs (`useSearchParams` on `/` requires Suspense boundary)
- [ ] Refactor `freelancer-portal/src/app/page.tsx` to wrap search-param redirect logic in `<Suspense>`
- [ ] Keep landing page UI unchanged
- [ ] Run production build (`npm run build`) in `freelancer-portal`
- [ ] Mark all tasks complete after verification
