# Quick Start Guide

Get the Miklens R&D Platform running in 5 minutes.

## 1. Install Dependencies (1 minute)

```bash
cd miklens-rnd
npm install
```

## 2. Setup Environment (2 minutes)

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your Firebase credentials
# (See SETUP.md for detailed instructions)
```

**Minimum required**:
```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=sender-id
VITE_FIREBASE_APP_ID=app-id
```

## 3. Start Development Server (1 minute)

```bash
npm run dev
```

App opens at: `http://localhost:5173`

## 4. Login

Use your Firebase Auth credentials:
- Email: Your registered email
- Password: Your password

## 5. Explore

- **Dashboard**: Main overview of projects and activities
- **Products**: Manage product pipeline
- **Experiments**: Track experiments and lab tests
- **Field Trials**: External field trial data
- **Daily Research Log**: Log daily activities
- **Team Activity**: View team member activities

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Build & Deploy
npm run build           # Production build
npm run preview         # Preview production build

# Quality
npm run lint            # Run linter
npm run test            # Run tests

# Firebase
firebase deploy         # Deploy to Firebase Hosting
firebase emulators:start # Start local emulator
```

---

## Environment Variables

### Required for Production
- `VITE_FIREBASE_*` - All 6 Firebase variables

### Optional
- `VITE_GOOGLE_CLIENT_ID` - For Google Drive integration
- `VITE_GOOGLE_API_KEY` - For Google Drive integration

### Feature Flags
```env
VITE_ENABLE_AI_CHATBOT=true    # Show AI assistant
VITE_ENABLE_ANALYTICS=true      # Show analytics page
VITE_ENABLE_AUDIT_LOGS=true     # Show audit logs page
```

---

## Useful Docs

- **Full Setup**: See `SETUP.md`
- **Security**: See `SECURITY.md`
- **Accessibility**: See `ACCESSIBILITY.md`
- **Refactoring Details**: See `REFACTORING_SUMMARY.md`

---

## Troubleshooting

### "Module not found" error
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

### Build fails
```bash
# Check TypeScript errors
npm run build

# Check for missing env vars
echo $VITE_FIREBASE_PROJECT_ID
```

### Firebase not connecting
1. Verify `.env.local` has all 6 Firebase variables
2. Check variables don't have quotes: `KEY=value` not `KEY="value"`
3. Restart dev server: `npm run dev`

---

## Project Structure

```
src/
├── pages/           # Page components (lazy-loaded)
├── components/      # Reusable components
├── contexts/        # State management (React Context)
├── hooks/           # Custom hooks
├── services/        # Business logic
├── config/          # Configuration
├── utils/           # Utilities
├── constants/       # Constants
└── types/           # TypeScript types
```

---

## Key Features

- ✅ Real-time database (Firestore)
- ✅ Offline-first with IndexedDB
- ✅ Role-based access control
- ✅ Research logging and tracking
- ✅ Team activity monitoring
- ✅ Field trial management
- ✅ PDF/Excel export
- ✅ Dark mode support
- ✅ PWA (works offline)
- ✅ Mobile responsive

---

## Support

### Documentation
- `SETUP.md` - Detailed setup instructions
- `SECURITY.md` - Security best practices
- `ACCESSIBILITY.md` - Accessibility guidelines

### Code Comments
Look for `/**` blocks in TypeScript files for usage examples.

### TypeScript Types
Check `src/types/` for data structure definitions.

---

## First Time Using Firebase?

1. Create account: https://firebase.google.com
2. Create new project
3. Add web app
4. Copy credentials to `.env.local`
5. Enable Email/Password authentication
6. Deploy Firestore security rules (see SETUP.md)

---

## Deploy to Production

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Vercel
```bash
git push origin main  # Auto-deploys with env vars configured
```

### Other Platforms
1. Build: `npm run build`
2. Deploy `dist/` folder
3. Configure environment variables
4. Configure SPA routing (rewrite to index.html)

---

## Next Steps

1. ✅ Read SETUP.md for complete instructions
2. ✅ Configure Firebase (see SETUP.md Firebase section)
3. ✅ Review SECURITY.md for production deployment
4. ✅ Check ACCESSIBILITY.md for code standards
5. ✅ Explore the codebase and familiarize yourself

---

## Need Help?

- Check relevant documentation files
- Review TypeScript types for data structures
- Look at similar components for patterns
- Check git history for recent changes
- Review inline code comments

Good luck! 🚀
