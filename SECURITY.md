# Security Best Practices

This document outlines security considerations and best practices for the Miklens R&D Platform.

---

## Environment Variables & Secrets

### ✅ DO

- Store all secrets in environment variables (`.env.local`)
- Use `.env.example` as a template with placeholder values
- Add `.env.local` to `.gitignore` (already configured)
- Use strong, randomly generated API keys
- Rotate credentials regularly
- Use different credentials for dev/staging/production
- Document all required environment variables in `SETUP.md`

### ❌ DON'T

- Hardcode API keys, tokens, or passwords in source code
- Commit `.env.local` or any files containing secrets to version control
- Share credentials via email or unencrypted channels
- Use the same credentials across environments
- Log sensitive information (passwords, tokens, API keys)
- Store user credentials in localStorage (Firebase Auth handles this)

### Environment Variable Categories

```env
# Firebase Credentials (Required for production)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_AUTH_DOMAIN=
# ... other Firebase variables

# Google Integration (Optional)
VITE_GOOGLE_CLIENT_ID=
VITE_GOOGLE_API_KEY=

# Feature Flags
VITE_ENABLE_AI_CHATBOT=
# ... other flags
```

---

## Authentication & Authorization

### Firebase Auth Best Practices

✅ **Enabled Features**:
- Email/Password authentication
- Firebase Session management
- Account disabled checks (`IsActive` field)
- Automatic token refresh

✅ **Implemented Security**:
- Protected routes with `<ProtectedRoute />`
- Role-based access control (RBAC)
- Account disabled check on auth state change
- Logout clears all session data

### Role-Based Access Control (RBAC)

Roles are mapped from Trial Manager to R&D system:

```typescript
// Trial Manager Role → R&D Role mapping
ADMIN/DEVELOPER → Admin
VIEWER/MANAGEMENT → Management
USER/SCIENTIST → Scientist
```

### Implementing Protected Routes

```tsx
// For public pages
<Route path="/login" element={<Login />} />

// For authenticated pages
<Route element={<ProtectedRoute />}>
  <Route path="/" element={<Dashboard />} />
</Route>

// For role-specific pages
<Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
  <Route path="/audit-logs" element={<AuditLogs />} />
</Route>
```

---

## Firestore Security Rules

### Collection-Level Access Control

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users - Only own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Products - Read for all auth users, write for admins
    match /products/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role 
                      in ['Admin', 'Developer'];
    }

    // Trials - Read/write for authenticated users
    match /trials/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Testing Security Rules

Use Firebase Emulator Suite:

```bash
# Start emulator
firebase emulators:start

# Run tests
firebase emulators:exec "npm run test:security"
```

---

## Data Validation & Sanitization

### Input Validation

Validate all user inputs on both client and server:

```tsx
// Client-side validation with Zod
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Server-side validation (Cloud Functions)
exports.validateAndSaveData = functions.https.onCall((data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Validate input
  if (!data.email || !data.email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email');
  }

  // Process data...
});
```

### Output Encoding

Always encode data before displaying:

```tsx
// ✅ GOOD - React automatically escapes by default
<p>{userInput}</p>

// ❌ BAD - Allows XSS attacks
<p dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ GOOD - If HTML is needed, sanitize first
import DOMPurify from 'dompurify';
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

---

## Network Security

### HTTPS Only

- All communication must use HTTPS
- Enable HSTS (HTTP Strict-Transport-Security)
- Configure in firebase.json:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          }
        ]
      }
    ]
  }
}
```

### CORS Configuration

Only allow trusted origins:

```typescript
// In Cloud Functions
const cors = require('cors')({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
});

exports.apiFunction = functions.https.onRequest((req, res) => {
  return cors(req, res, () => {
    // Handle request
  });
});
```

---

## Logging & Monitoring

### What NOT to Log

❌ **Never log**:
- Passwords or API keys
- Personal Identifiable Information (PII)
- Credit card numbers
- Authentication tokens
- Sensitive business data

### What TO Log

✅ **Safe to log**:
- User ID (not email if avoidable)
- Action performed (login, create, update, delete)
- Resource IDs
- Timestamps
- Status codes
- Non-sensitive error messages

### Secure Logging Example

```typescript
// ✅ GOOD - Logs action without sensitive data
logger.info('User login', {
  module: 'Auth',
  userId: user.uid, // OK - user ID
  timestamp: new Date(),
});

// ❌ BAD - Logs password
logger.info('User login', {
  email: user.email,
  password: user.password, // NEVER!
});
```

---

## Dependencies & Vulnerabilities

### Check for Vulnerabilities

```bash
# Audit dependencies for known vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# View detailed vulnerability info
npm audit --detailed

# Check for outdated packages
npm outdated
```

### Dependency Security Best Practices

- Keep dependencies up to date
- Use exact versions (not ranges) in `package-lock.json`
- Regularly run security audits
- Review dependency changelogs before updating
- Remove unused dependencies
- Use well-maintained, popular packages

### Lock File Security

- Always commit `package-lock.json`
- Never manually edit `package-lock.json`
- Use `npm ci` instead of `npm install` in CI/CD

---

## Deployment Security

### Pre-Deployment Checklist

- [ ] All secrets removed from source code
- [ ] Environment variables configured in deployment platform
- [ ] Security rules reviewed and deployed to Firestore
- [ ] HTTPS enabled on domain
- [ ] API rate limiting configured
- [ ] CORS headers configured
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] Dependencies audited for vulnerabilities
- [ ] Error messages don't expose system details
- [ ] Logging configured appropriately

### Production Environment Setup

Firebase Hosting:

```bash
# Configure production rules
firebase deploy --only firestore:rules

# Set environment variables
firebase functions:config:set app.env="production"

# Deploy functions
firebase deploy --only functions
```

Vercel:

```bash
# Set environment variables in Vercel dashboard
# Settings → Environment Variables → Add

VITE_FIREBASE_API_KEY=***
VITE_FIREBASE_PROJECT_ID=***
# ... other variables

# Deploy
git push origin main  # Auto-deploys from main branch
```

---

## Security Incident Response

### If You Suspect a Breach

1. **Immediately revoke credentials**:
   - Change all API keys and passwords
   - Rotate Firebase service accounts
   - Clear all active sessions

2. **Assess scope**:
   - Determine what data may have been accessed
   - Check logs for suspicious activity
   - Review Firestore access patterns

3. **Notify stakeholders**:
   - Inform users if personal data was exposed
   - Follow GDPR/privacy law requirements
   - Document incident details

4. **Implement fixes**:
   - Deploy security patches
   - Update security rules
   - Monitor for recurring issues

### Incident Response Contacts

- **Firebase Support**: https://firebase.google.com/support
- **Google Cloud Security**: https://cloud.google.com/security/response-center
- **Local authorities** (if required by law)

---

## Regular Security Tasks

### Weekly

- Review Firebase usage/costs (early detection of abuse)
- Check application logs for errors
- Monitor error tracking system

### Monthly

- Run `npm audit`
- Review Firestore access patterns
- Check for unused/deprecated APIs

### Quarterly

- Security review of code changes
- Dependency version updates
- Firestore rule review
- Backup data verification

### Annually

- Full security audit
- Penetration testing (if applicable)
- Compliance review (GDPR, CCPA, etc.)
- Update security policies

---

## Resources

- **Firebase Security**: https://firebase.google.com/docs/rules
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Google Cloud Security Best Practices**: https://cloud.google.com/docs/security
- **npm Security**: https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities

---

## Questions or Security Issues?

For security concerns:
1. **Do not** create public issues on GitHub
2. Email security concerns to: security@miklensbio.com
3. Or file a private security advisory

Thank you for helping keep Miklens R&D Platform secure!
