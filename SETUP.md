# Miklens R&D Platform - Setup & Configuration Guide

## Overview

Miklens R&D Management is an enterprise-grade React + TypeScript application for managing agricultural research and development operations. It integrates with Firebase Firestore for real-time data synchronization and supports offline-first functionality.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Installation](#installation)
4. [Firebase Setup](#firebase-setup)
5. [Running the Application](#running-the-application)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)
8. [Architecture Overview](#architecture-overview)

---

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher (or yarn/pnpm)
- **Git**: For version control
- **Firebase Account**: For backend services (optional for development)

---

## Environment Configuration

### 1. Create `.env.local` File

Copy the `.env.example` file and create your own `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` and fill in your Firebase credentials:

```env
# Firebase Configuration (Get from Firebase Console)
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google Drive (Optional)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_API_KEY=your-google-api-key

# Feature Flags
VITE_ENABLE_AI_CHATBOT=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_AUDIT_LOGS=true
VITE_ENABLE_GOOGLE_DRIVE=false
```

### Important Security Notes

⚠️ **Never commit `.env.local` to version control**
- Add `.env.local` to `.gitignore` (already configured)
- Environment variables containing secrets should never be stored in the repository
- Use CI/CD secrets management for production deployments

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/miklens-rnd.git
cd miklens-rnd
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Verify Installation

```bash
npm run build
```

---

## Firebase Setup

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Add a Web app to your project
4. Copy the configuration object
5. Fill in `.env.local` with these credentials

### Firestore Security Rules

Create appropriate security rules in Firestore Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - Only authenticated users can read/write their own
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Products collection - Authenticated users can read, Admins can write
    match /products/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'Developer'];
    }

    // Trials collections - Allow based on user permissions
    match /trials/{document=**} {
      allow read, write: if request.auth != null;
    }

    match /herbicide_trials/{document=**} {
      allow read, write: if request.auth != null;
    }

    match /fungicide_trials/{document=**} {
      allow read, write: if request.auth != null;
    }

    match /pesticide_trials/{document=**} {
      allow read, write: if request.auth != null;
    }

    match /nutrition_trials/{document=**} {
      allow read, write: if request.auth != null;
    }

    match /biostimulant_trials/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Firebase Authentication Setup

1. Go to Authentication in Firebase Console
2. Enable Email/Password sign-in method
3. Create test users for development
4. (Optional) Enable additional providers (Google, etc.)

---

## Running the Application

### Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Run Tests

```bash
npm run test
```

### Lint Code

```bash
npm run lint
```

---

## Deployment

### Deploying to Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase (if not already done):
   ```bash
   firebase init
   ```

4. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```

### Deploying to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel will auto-deploy on push

### Deploying to Other Platforms

The app is compatible with:
- Netlify
- AWS Amplify
- GitHub Pages
- Traditional web servers (SPA rewrite required)

---

## Troubleshooting

### Firebase Not Configured

**Error**: "Firebase not properly configured"

**Solution**: Ensure all required Firebase environment variables are set in `.env.local`:

```bash
# Check which variables are missing
echo $VITE_FIREBASE_PROJECT_ID
echo $VITE_FIREBASE_API_KEY
```

### Build Fails with Type Errors

**Solution**: Ensure TypeScript is up to date:

```bash
npm run build  # Will show specific errors
```

### Port 5173 Already in Use

**Solution**: Use a different port:

```bash
npm run dev -- --port 3000
```

### Offline Persistence Not Working

**Problem**: IndexedDB persistence fails in some browsers/environments

**Solution**: 
- Works in Chromium-based browsers by default
- Firefox requires additional setup
- Check browser console for specific error messages
- Fallback to localStorage-only mode if needed

---

## Architecture Overview

### Directory Structure

```
src/
├── components/       # React components
│   ├── ui/          # Reusable UI components (Button, Badge)
│   └── *.tsx        # Feature components
├── config/          # Configuration files
│   ├── firebase.ts  # Firebase initialization
│   └── appConfig.ts # App-level configuration
├── contexts/        # React context providers
├── hooks/           # Custom React hooks
├── layouts/         # Page layouts
├── pages/           # Page components (lazy-loaded)
├── services/        # Business logic & API calls
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
│   ├── logger.ts    # Structured logging
│   └── roleAdapter.ts # Role mapping
├── constants/       # App constants & configuration
└── main.tsx        # Entry point
```

### Key Technologies

- **React 19.2.7**: UI framework
- **TypeScript**: Type safety
- **Vite 8.1.1**: Build tool
- **Firebase 11.10.0**: Backend & authentication
- **Tailwind CSS 3.4.17**: Styling
- **React Router 7.18.1**: Client-side routing
- **React Query 5.101.2**: Server state management
- **Framer Motion 12.42.2**: Animations
- **Lucide React 1.23.0**: Icons

---

## Feature Flags

Control feature availability at runtime via environment variables:

```env
VITE_ENABLE_AI_CHATBOT=true       # Enable AI chatbot widget
VITE_ENABLE_ANALYTICS=true        # Enable analytics dashboard
VITE_ENABLE_AUDIT_LOGS=true       # Enable audit log page
VITE_ENABLE_GOOGLE_DRIVE=false    # Enable Google Drive integration
```

---

## Logging

The app uses a centralized logging system. Configure in `src/utils/logger.ts`:

**Log Levels**:
- `debug` - Development debugging info
- `info` - General information
- `warn` - Warnings
- `error` - Errors

In development, all logs are shown. In production, only `warn` and `error` are logged.

---

## Support & Contact

For issues, questions, or contributions:
- Create an issue on GitHub
- Check documentation in `/docs`
- Review `.env.example` for configuration help

---

## License

This project is proprietary software. All rights reserved.
