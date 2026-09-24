# Synthexis - Strategic Research Lab

A professional multi-agent AI research platform that runs entirely in your browser with zero backend costs.

## 🚀 Key Features

### **Multi-Mode AI Research**
- **Council Mode**: Multi-agent debate (Architect, Skeptic, Verifier, Arbiter, Synthesizer)
- **Solo Mode**: Single model research for quick answers
- **Offline Support**: Use Ollama/PocketPal for local AI inference

### **Data Ownership & Privacy**
- **Google Drive Storage**: All sessions saved to YOUR Drive, not our servers
- **Zero Infrastructure Costs**: We don't pay for storage, you own your data
- **Cross-Device Sync**: Access your research from any device
- **Local-First**: Works offline with cached data

### **Advanced Capabilities**
- **PDF Analysis**: Upload and analyze research papers
- **Code Execution**: Run code snippets in sandboxed environment
- **Multiple Providers**: Gemini, Groq, SambaNova, OpenRouter, Ollama
- **Search Grounding**: Real-time web search integration

## 🛠️ Setup Instructions

### 1. Firebase Authentication Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Google Sign-In**:
   - Go to Authentication → Sign-in method
   - Enable Google provider
   - Add your authorized domains
4. Copy your Firebase config

### 2. Google Drive API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Drive API**
3. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Create OAuth client ID (Web application)
   - Add authorized redirect URIs
4. Copy your Client ID

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Firebase Config (Required for Auth)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Google OAuth (Required for Drive)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## 🔐 Authentication Flow

1. User clicks "Sign in with Google"
2. Firebase handles OAuth popup
3. On success, user can optionally connect Google Drive
4. If Drive connected: sync sessions to `/Synthexis_Data/sessions/`
5. If no Drive: use local IndexedDB storage

## 📁 Google Drive Structure

```
My Drive/
└── Synthexis_Data/
    ├── synthexis_metadata.json (session index)
    └── sessions/
        ├── session_abc123.json
        ├── session_def456.json
        └── ...
```

## 🌐 Offline Mode with Ollama

### Setup Ollama

1. Install Ollama: https://ollama.ai
2. Pull models:
   ```bash
   ollama pull llama3.2
   ollama pull mistral
   ```
3. Ollama runs on `http://localhost:11434` by default

### Configure in App

1. Go to Settings → AI Providers
2. Enable "Ollama (Offline)"
3. Select your local model
4. Start researching without internet!

## 📄 PDF Analysis

1. Click the paperclip icon in the input
2. Select PDF file(s)
3. App extracts text and metadata
4. Use extracted content in debates

## 🎨 Design Philosophy

- **Professional Blue/Gray Theme**: Clean, corporate aesthetic
- **Minimal Animations**: Focus on productivity, not flashiness
- **Plain Language**: No theatrical "Council Chamber" metaphors
- **Accessibility**: WCAG 2.1 AA compliant

## 🚧 Roadmap

### Phase 1: Core Features (Current)
- ✅ Google Drive integration
- ✅ Ollama offline support
- ✅ Solo mode
- ✅ PDF analysis
- ⏳ Code execution (WebContainers)

### Phase 2: Advanced Features
- ⏳ Team collaboration
- ⏳ Public shareable transcripts
- ⏳ Usage analytics dashboard
- ⏳ Custom agent personas

### Phase 3: Monetization
- ⏳ Freemium tiers
- ⏳ Usage quotas
- ⏳ Stripe integration
- ⏳ Enterprise features

## 🛡️ Security Considerations

### Current Implementation
- API keys stored in localStorage (encrypted at rest recommended)
- Google OAuth tokens managed by Firebase
- Drive files private to user's account

### Future Improvements
- Server-side API key management
- End-to-end encryption for sensitive sessions
- Key rotation mechanisms
- XSS protection hardening

## 📊 Cost Model

**For Users:**
- Free: Google Drive storage (counts against your quota)
- API costs: Your own API keys (Gemini, Groq, etc.)
- Offline: Free with Ollama (your electricity)

**For Platform:**
- Hosting: ~$0 (static site on Vercel/Netlify)
- Database: $0 (using user's Drive)
- Auth: Free tier (Firebase)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Submit PR with description

## 📝 License

MIT License - See LICENSE file

## 💡 Why This Architecture?

Traditional SaaS:
```
User → Our Server → Our Database → Our Costs → Monthly Subscription
```

Synthexis Model:
```
User → Browser → Their Drive → Their Control → Pay Only for API Usage
```

**Benefits:**
- Zero infrastructure costs = sustainable free tier
- Users own their data = GDPR compliant by design
- Cross-device sync = better UX
- No vendor lock-in = user trust
