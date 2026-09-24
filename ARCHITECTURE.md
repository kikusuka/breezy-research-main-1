# Synthexis Architecture Overview

## 🎯 Problem We're Solving

Traditional AI research platforms have fundamental flaws:
1. **Vendor lock-in**: Your data lives on their servers
2. **Recurring costs**: Monthly subscriptions for basic features
3. **No offline support**: Useless without internet
4. **Privacy concerns**: They see all your research queries
5. **Limited customization**: Can't bring your own models

## 💡 Our Solution

**Synthexis** is a browser-first AI research platform with:
- **User-owned storage**: Google Drive, not our database
- **Zero backend costs**: Static site hosting only
- **Offline capability**: Ollama integration for local AI
- **Bring-your-own-model**: Gemini, Groq, Ollama, etc.
- **Professional UX**: Clean, corporate design

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Local Cache │  │  PDF Parser  │      │
│  │              │  │  (IndexedDB) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Auth      │  │   Ollama     │  │  Google      │      │
│  │   (Firebase) │  │   Service    │  │  Drive API   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Firebase      │  │   Localhost:    │  │  Google Drive   │
│  Authentication │  │   11434         │  │  (User's Cloud) │
│                 │  │  (Ollama)       │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  AI Providers   │
│  - Gemini API   │
│  - Groq API     │
│  - SambaNova    │
│  - OpenRouter   │
└─────────────────┘
```

## 📦 Core Services

### 1. Authentication Service (`authService.ts`)
- Firebase OAuth 2.0 with Google
- Manages user sessions
- Provides access tokens for Drive API
- **Security**: Tokens stored in memory, refreshed automatically

### 2. Google Drive Service (`googleDriveService.ts`)
- Creates `/Synthexis_Data/sessions/` folder structure
- Saves each session as individual JSON file
- Maintains metadata index file
- Handles sync conflicts gracefully
- **File Format**: `session_<id>.json`

### 3. Ollama Service (`ollamaService.ts`)
- Connects to local Ollama instance
- Supports streaming responses
- Model management (pull, delete, list)
- Works completely offline
- **Endpoint**: `http://localhost:11434`

### 4. PDF Service (`pdfService.ts`)
- Extracts text from PDF files
- Preserves page structure
- Searches within documents
- Converts to markdown format
- **Library**: PDF.js

## 🔄 Data Flow

### Login Flow
```
1. User clicks "Sign in with Google"
2. Firebase popup → Google OAuth
3. On success: Firebase returns ID token + access token
4. App stores tokens in memory (not localStorage!)
5. User authenticated ✅
```

### Drive Sync Flow
```
1. User completes login
2. App requests Drive API scope
3. User grants permission
4. App creates/checks Synthexis_Data folder
5. On session save:
   - Upload session_*.json to Drive
   - Update metadata index
6. On app load:
   - Check Drive for existing sessions
   - Download and cache locally
```

### Offline AI Flow
```
1. User enables "Ollama Mode" in settings
2. App checks connection to localhost:11434
3. User selects local model (e.g., llama3.2)
4. All AI requests go to Ollama instead of cloud APIs
5. Zero API costs, complete privacy ✅
```

## 🗂️ File Structure

```
src/
├── services/
│   ├── authService.ts        # Firebase authentication
│   ├── googleDriveService.ts # Drive API operations
│   ├── ollamaService.ts      # Local AI inference
│   ├── pdfService.ts         # PDF parsing
│   └── server.ts             # API proxy (optional)
├── components/
│   ├── AuthModal.tsx         # Login UI
│   ├── Header.tsx            # Navigation
│   ├── PromptInput.tsx       # Main input
│   └── ...                   # Other components
├── hooks/
│   └── useLocalStorage.ts    # Persistent state
├── types.ts                  # TypeScript definitions
└── App.tsx                   # Main application
```

## 🔒 Security Model

### What We Store
| Data Type | Location | Encryption |
|-----------|----------|------------|
| Auth tokens | Memory (runtime only) | N/A (HTTPS) |
| API keys | localStorage | None ⚠️ |
| Sessions | Google Drive | Google's encryption |
| Preferences | localStorage | None |

### Security Considerations
1. **API Keys**: Currently in localStorage - consider encrypted storage
2. **XSS Protection**: Sanitize all user inputs
3. **CORS**: Drive API requires proper origin configuration
4. **Token Expiry**: Refresh tokens before expiration

## 🚀 Performance Optimizations

### Caching Strategy
```typescript
// 1. IndexedDB for large session data
const db = await openDB('synthexis-cache', 1);

// 2. In-memory cache for active session
const activeSessionRef = useRef<DebateSession | null>(null);

// 3. Background sync with Drive
useEffect(() => {
  const syncInterval = setInterval(syncWithDrive, 30000); // 30s
  return () => clearInterval(syncInterval);
}, []);
```

### Lazy Loading
- Load GAPI script only when Drive connect requested
- Initialize Ollama service on-demand
- PDF.js worker loaded from CDN

## 📊 Cost Analysis

### For Users
| Feature | Cost |
|---------|------|
| Platform | Free |
| Storage | Free (user's Drive quota) |
| Cloud AI | Pay-per-use (own API keys) |
| Offline AI | Free (electricity only) |

### For Platform Owners
| Expense | Monthly Cost |
|---------|-------------|
| Hosting (Vercel) | $0 |
| Database | $0 (user's Drive) |
| Authentication | $0 (Firebase free tier) |
| Bandwidth | $0 (CDN) |
| **Total** | **$0** |

## 🎯 Competitive Advantages

1. **No Infrastructure Costs**: Sustainable free tier forever
2. **Data Ownership**: Users control their research
3. **Offline Capability**: Unique selling point
4. **Multi-Provider**: Not locked to one AI vendor
5. **Professional Design**: Appeals to enterprise users

## 🛣️ Future Roadmap

### Phase 1: Foundation (Current)
- ✅ Google Drive storage
- ✅ Ollama offline support
- ✅ Solo mode
- ✅ PDF analysis

### Phase 2: Collaboration
- Share sessions via Drive sharing
- Real-time co-editing (Yjs CRDT)
- Team workspaces

### Phase 3: Advanced Features
- Custom agent personas
- Code execution sandbox
- Usage analytics
- Export to Notion/Obsidian

### Phase 4: Monetization
- Freemium tiers (feature gates)
- Team plans
- Enterprise SSO
- White-label options

## 🤝 Contributing Guidelines

1. **TypeScript First**: All new code must be typed
2. **Test Coverage**: Add tests for new services
3. **Accessibility**: WCAG 2.1 AA minimum
4. **Performance**: No regressions in Lighthouse scores
5. **Documentation**: Update README for new features
