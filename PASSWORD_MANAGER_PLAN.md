# Next.js Password Manager - Project Blueprint

## 1. Goal
Build a secure web-based password manager in Next.js where users can:
- Manually add and manage credentials.
- Generate strong passwords automatically.
- Store and retrieve passwords safely with strong security practices.

## 2. Core Features

### Authentication & User Access
- User sign up and login.
- Optional social auth (Google/GitHub) if needed.
- Session management with secure HTTP-only cookies.
- Auto logout after inactivity.

### Vault Management
- Add password entries manually:
  - Website/App name
  - Username/Email
  - Password
  - Notes (optional)
  - Tags/folders (optional)
- Edit, delete, and search entries.
- Favorite/pin important entries.

### Password Generator
- Generate random strong passwords.
- User options:
  - Length selector
  - Uppercase/lowercase
  - Numbers
  - Symbols
  - Avoid ambiguous characters
- Password strength meter (weak/medium/strong).

### Security Utilities
- Copy password with one-click and short-lived clipboard warning.
- Show/hide password toggle.
- Breach check integration (optional, privacy-safe API strategy).
- Password health dashboard:
  - Reused passwords
  - Weak passwords
  - Very old passwords

### UI, Components, and Theme
- Use `shadcn/ui` for reusable built-in components.
- Consistent spacing, typography, and component variants across pages.
- Support both light and dark themes.
- Theme toggle in navbar/settings and persistent theme preference.
- Ensure all screens are responsive and accessible in both themes.

## 3. Tech Stack
- Framework: Next.js (App Router)
- Language: TypeScript
- UI Components: shadcn/ui
- Styling: Tailwind CSS + CSS variables for design tokens
- Theme: `next-themes` with light/dark mode
- Database: MongoDB
- ORM/ODM: Mongoose
- Auth: NextAuth/Auth.js or custom JWT + refresh flow
- Validation: Zod
- Deployment: Vercel

## 4. Security Architecture (Most Important)

### Encryption Model
Use a zero-knowledge-style approach where possible:
1. User enters a master password (never stored directly).
2. Derive an encryption key using Argon2id (preferred) or PBKDF2 with high iteration count.
3. Encrypt each vault password client-side (AES-256-GCM) before sending to server.
4. Server stores only encrypted data + required metadata (salt, nonce/iv, auth tag).

Result: Even if DB is leaked, plaintext passwords are not directly exposed.

### Password Hashing (for account login)
- Hash login password with Argon2id (or bcrypt with strong cost factor).
- Never store plaintext passwords.
- Use per-user unique salt.

### Transport & Platform Security
- Force HTTPS everywhere.
- Use secure headers:
  - Content-Security-Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
- Enable HSTS in production.

### Session Security
- HTTP-only, Secure, SameSite=strict cookies.
- CSRF protection for state-changing requests.
- Rate limiting on login, signup, and password reset routes.
- Brute-force lockout/cooldown policy.

### Data Protection
- Encrypt sensitive fields at rest.
- Audit logs for critical account actions.
- Soft delete + secure hard delete option.
- Database backups encrypted and access-controlled.

### App Security Practices
- Input validation with Zod on client and server.
- Use safe Mongoose queries and schema constraints.
- Prevent XSS by escaping output and strict CSP.
- Prevent SSRF/Open redirects with strict URL validation.
- Dependency scanning (`npm audit`, Snyk, or GitHub Dependabot).

## 5. Suggested Project Structure
```txt
src/
  app/
    (auth)/
    dashboard/
    api/
  components/
    ui/            # shadcn/ui generated components
  lib/
    crypto/
    auth/
    db/
      mongoose.ts
    validators/
  hooks/
  types/
models/
```

## 6. Development Roadmap

### Phase 1: Setup
- Initialize Next.js + TypeScript project.
- Configure Tailwind CSS and install shadcn/ui.
- Configure `next-themes` for light/dark mode.
- Connect MongoDB and setup Mongoose.

### Phase 2: Authentication
- Implement signup/login/logout.
- Add secure session handling.
- Add forgot/reset password flow.

### Phase 3: Vault CRUD
- Create encrypted vault entry model with Mongoose.
- Build add/edit/delete/list/search UI using shadcn components.
- Add client-side encryption/decryption flow.

### Phase 4: Password Generator
- Build generator utility and UI.
- Add strength scoring and rules.

### Phase 5: Hardening & Quality
- Add rate limiting and security headers.
- Add tests:
  - Unit tests (crypto helpers, validation)
  - Integration tests (auth + vault APIs)
  - E2E tests (critical user flows)
- Performance and accessibility checks in light and dark themes.

### Phase 6: Deploy
- Deploy on Vercel.
- Configure production MongoDB and env secrets.
- Enable monitoring and error tracking (Sentry).

## 7. Environment Variables (Example)
```env
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ENCRYPTION_PEPPER=
```

## 8. MVP Scope (First Version)
For fastest delivery, first release should include:
- Email/password auth
- Add/edit/delete credential entries
- Password generator
- Search
- Basic encryption and secure sessions
- Light/dark mode with shadcn-based UI

Advanced features (2FA, sharing, breach checks, browser extension) can be added later.

## 9. Future Enhancements
- Two-factor authentication (TOTP/WebAuthn)
- Secure password sharing between users
- Import/export encrypted vault
- Browser extension autofill
- Mobile app client

## 10. Success Criteria
- Users can safely store and retrieve credentials.
- Passwords are encrypted before storage.
- Security controls pass basic OWASP checks.
- UI remains consistent and accessible in both light and dark themes.
- App feels fast and simple for daily use.
