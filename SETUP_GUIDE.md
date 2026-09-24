# 🚀 Synthexis Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Authentication (Required)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google Drive API (Required for cloud sync)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run Development Server
```bash
npm run dev
```

---

## 🔐 Step-by-Step Setup Instructions

### A. Firebase Authentication Setup

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create a new project** (or use existing one)
3. **Enable Google Authentication**:
   - Go to **Authentication** → **Sign-in method**
   - Click **Google** → Enable → Save
4. **Get your Firebase config**:
   - Go to **Project Settings** (gear icon)
   - Scroll down to "Your apps" → Select Web app
   - Copy the `firebaseConfig` values
5. **Add to `.env`** file with the `VITE_` prefix

### B. Google Drive API Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your Firebase project** (or create new one)
3. **Enable Google Drive API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Drive API" → Enable
4. **Create OAuth Credentials**:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Add authorized origins: `http://localhost:5173` (dev) and your production domain
   - Copy the **Client ID**
5. **Add to `.env`**:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

### C. Configure Google OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type → Create
3. Fill in required fields:
   - App name: Synthexis
   - User support email: your email
   - Developer contact: your email
4. **Add Scopes**:
   - Click **Add or Remove Scopes**
   - Add: `.../auth/drive.file` (access to files created by the app)
   - Add: `.../auth/userinfo.email` (for authentication)
5. **Save and Continue**

---

## 🎯 Features Overview

### ✅ Core Features

1. **Google Drive Storage**
   - Sessions saved directly to user's Google Drive
   - Path: `/Synthexis_Data/sessions/session_<id>.json`
   - Zero server costs for you
   - Users own their data completely
   - Cross-device sync via Drive

2. **Storage Quota Management**
   - Users can set custom storage limits (default: 100MB)
   - Visual progress bar showing usage
   - Automatic warnings when approaching limit (80% threshold)
   - Smart recommendations for which sessions to delete
   - Sessions sorted by size to help decision-making

3. **Solo Mode**
   - Single-model research mode (no multi-agent debate)
   - Faster responses, lower token usage
   - Perfect for quick questions and simple research

4. **Offline AI Support (Ollama)**
   - Connect to local Ollama instance (`localhost:11434`)
   - Works completely offline - zero API costs
   - Support for any Ollama model (Llama 3.2, Mistral, etc.)
   - Model management (pull, delete, list models)

5. **PDF Analysis**
   - Upload and analyze research papers
   - Extract text while preserving page structure
   - Search within documents
   - Convert PDFs to markdown format

6. **Multi-Provider Support**
   - Gemini (Google)
   - Groq (fast inference)
   - SambaNova
   - OpenRouter (access to 100+ models)
   - Ollama (local/offline)

7. **Debate Protocols**
   - **Trio**: Architect + Skeptic + Arbiter (3 agents)
   - **Quad**: Architect + Skeptic + Verifier + Arbiter (4 agents)
   - **Duel**: Architect vs Skeptic (2 agents)
   - **Solo**: Single model research (1 agent)

---

## 📦 Installing Ollama (Optional - For Offline AI)

### macOS/Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Windows
Download from: https://ollama.ai/download

### Pull Models
```bash
# Recommended models for research
ollama pull llama3.2          # 3B - Fast, good for most tasks
ollama pull llama3.2:7b       # 7B - Better quality
ollama pull mistral           # 7B - Excellent reasoning
ollama pull codellama         # Specialized for coding
```

### Verify Installation
```bash
ollama list
ollama run llama3.2 "Hello!"
```

---

## 💾 Storage Quota System

### How It Works

1. **Default Limit**: 100MB in Google Drive
2. **Warning Threshold**: 80% usage triggers alerts
3. **Smart Recommendations**: When near limit, system suggests largest sessions for deletion

### User Controls

- **Preset Limits**: 50MB, 100MB, 250MB, 500MB, 1GB
- **Custom Limit**: Enter any value (minimum 10MB)
- **Visual Progress Bar**: Color-coded (blue → amber → red)
- **One-Click Delete**: Remove recommended sessions instantly

### Example Usage Flow

```
User sets limit: 100MB
Current usage: 85MB (85%)
→ Warning appears: "Approaching Storage Limit"
→ Shows top 5 largest sessions with sizes
→ User deletes 2 large sessions (15MB freed)
→ New usage: 70MB (70%)
```

---

## 🔒 Security & Privacy

### Data Storage
- **No backend database** - all data in user's Google Drive
- **User owns everything** - export anytime, no vendor lock-in
- **Encrypted in transit** - HTTPS for all API calls
- **Local-first** - works offline with IndexedDB fallback

### API Keys
- Stored in browser localStorage (encrypted at rest recommended)
- Never sent to our servers (direct to provider APIs)
- Users can rotate keys anytime in Vault settings

### Authentication
- Real Google OAuth via Firebase
- No passwords stored
- Session persists across browser restarts
- Secure token refresh mechanism

---

## 🎨 Professional Design

### Color Palette
- **Primary**: Slate blue-gray tones
- **Accent**: Professional blue (#2563eb)
- **Background**: Light gray (slate-50) with white panels
- **Dark Mode**: Deep slate (slate-900) with subtle contrasts

### Typography
- **Font**: Inter (clean, professional sans-serif)
- **Sizing**: Clear hierarchy with readable body text
- **Contrast**: WCAG AA compliant

### UX Principles
- Minimal animations (productivity-focused)
- Plain language (no theatrical metaphors)
- Clear visual feedback for all actions
- Mobile-responsive design

---

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Hosting

#### Option 1: Vercel (Recommended)
```bash
npm i -g vercel
vercel deploy
```

#### Option 2: Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

#### Option 3: Static Hosting
Copy `dist/` folder to any static host (S3, Cloudflare Pages, etc.)

### Environment Variables in Production
Don't forget to add all `.env` variables to your hosting platform's environment settings!

---

## 🐛 Troubleshooting

### "Google Drive Not Connected"
- Check if `VITE_GOOGLE_CLIENT_ID` is set correctly
- Verify OAuth consent screen is configured
- Ensure authorized origins include your domain
- Try reconnecting in Settings → Google Drive

### "Firebase Auth Failed"
- Verify all Firebase config values are correct
- Check if Google Sign-In is enabled in Firebase Console
- Ensure authorized domains are added in Firebase

### Ollama Connection Issues
- Make sure Ollama is running: `ollama list`
- Check CORS settings if running on different port
- Verify baseUrl in Settings matches your setup

### Storage Quota Warnings
- Delete old/large sessions from History modal
- Increase quota limit in Storage Settings
- Export important sessions before deleting

---

## 📊 Cost Analysis

### Traditional SaaS Model
- Server costs: $500-2000/month
- Database: $100-500/month
- File storage: $50-200/month
- **Total**: $650-2700/month

### Synthexis Model
- Hosting: $0 (static files on Vercel/Netlify free tier)
- Database: $0 (user's Google Drive)
- Storage: $0 (user's Drive quota)
- **Total**: $0/month

### User Costs
- **Online AI**: Pay for their own API keys (Gemini, Groq, etc.)
- **Offline AI**: Free with Ollama (uses their hardware)
- **Storage**: Free within Google Drive 15GB limit

---

## 🎯 Competitive Advantages

| Feature | Traditional AI Tools | Synthexis |
|---------|---------------------|-----------|
| Data Ownership | Company servers | User's Google Drive |
| Cross-Device Sync | Paid subscription | Free via Drive |
| Offline Mode | ❌ None | ✅ Ollama support |
| Storage Limits | Company-controlled | User-defined |
| Cost Model | Monthly subscription | Free forever |
| Vendor Lock-in | High | None |
| Privacy | Company access | User-only access |

---

## 📝 Future Enhancements

### Planned Features
- [ ] Team collaboration (shared Drive folders)
- [ ] Version history for sessions
- [ ] Advanced search across all sessions
- [ ] Custom agent personas
- [ ] Template library for common research tasks
- [ ] Browser extension for quick research
- [ ] Mobile app with Drive sync

### Enterprise Features
- [ ] SSO integration (Okta, Azure AD)
- [ ] Audit logs for compliance
- [ ] Custom branding
- [ ] Priority support
- [ ] SLA guarantees

---

## 🤝 Support

For issues or questions:
1. Check this README first
2. Review error messages in browser console (F12)
3. Verify environment variables are set correctly
4. Test with default settings before customizing

---

## 📄 License

MIT License - Feel free to use, modify, and distribute.

---

**Built with ❤️ for researchers who value privacy, ownership, and control.**
