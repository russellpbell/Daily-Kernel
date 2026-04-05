# Daily Kernel iOS App

A SwiftUI iOS app for Daily Kernel - your AI-powered daily learning companion.

## Setup Instructions

### 1. Create Xcode Project

1. Open Xcode 15+
2. File → New → Project → iOS → App
3. Product Name: **DailyKernel**
4. Team: Your Apple Developer account
5. Organization Identifier: `com.dailykernel`
6. Interface: **SwiftUI**
7. Language: **Swift**
8. Save in the `ios/` directory (replace the generated files)

### 2. Add Source Files

Drag all files from these directories into the Xcode project navigator:
- `DailyKernel/App/` - App entry point and root views
- `DailyKernel/Models/` - Data models
- `DailyKernel/Services/` - API client and auth
- `DailyKernel/Views/` - All SwiftUI views
- `DailyKernel/Utils/` - Colors, helpers

### 3. Configure Assets

The `Assets.xcassets` folder includes:
- `AccentColor` - App accent color (indigo #6366F1)
- `AppIcon` - Add your app icon here (1024x1024 PNG)

### 4. Configure Entitlements

Add `DailyKernel.entitlements` to the project and enable:
- Push Notifications (aps-environment)
- Sign in with Apple (com.apple.developer.applesignin)

### 5. Set Up Sign in with Apple

1. **Apple Developer Portal**: Go to Certificates, Identifiers & Profiles -> Identifiers. Select your App ID (`com.dailykernel.DailyKernel`) and enable the "Sign in with Apple" capability.
2. **Create a Service ID** (for Supabase server-side verification): Register a new Services ID under Identifiers -> Services IDs. Configure the web authentication redirect URL to your Supabase project callback: `https://your-project.supabase.co/auth/v1/callback`.
3. **Generate a Key**: Under Keys, create a new key with "Sign in with Apple" enabled. Download the `.p8` file and note the Key ID.
4. **Supabase Dashboard**: Go to Authentication -> Providers -> Apple -> Enable. Enter your Service ID, Team ID, Key ID, and upload the `.p8` private key.
5. **Xcode**: Open the project, go to Signing & Capabilities, click "+ Capability", and add "Sign in with Apple".

### 6. Set Environment Variables

In Xcode: Product → Scheme → Edit Scheme → Run → Arguments → Environment Variables:

| Variable | Value |
|---|---|
| `API_BASE_URL` | `https://your-vercel-app.vercel.app` (or `http://localhost:3000` for dev) |
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key |

### 7. Build & Run

- Select an iPhone 15 simulator or your device
- Press ⌘R to build and run
- Minimum deployment target: iOS 17.0

## Architecture

```
DailyKernel/
├── App/
│   ├── DailyKernelApp.swift    # @main entry point
│   ├── ContentView.swift        # Auth routing
│   └── MainTabView.swift        # Tab navigation
├── Models/                      # Codable data models
├── Services/
│   ├── APIClient.swift          # HTTP client for backend API
│   ├── AuthService.swift        # Supabase auth (Sign in with Apple + OTP fallback)
│   └── NotificationService.swift # Push notifications
├── Views/
│   ├── Auth/                    # Login + OTP verification
│   ├── Briefing/                # Card stack + swipe gestures
│   ├── Feed/                    # Interest feed (infinite scroll)
│   ├── Library/                 # Reading list + knowledge
│   ├── Categories/              # Category management
│   ├── Stats/                   # Streaks + heatmap
│   ├── Settings/                # User preferences
│   └── Components/              # Shared UI components
└── Utils/                       # Colors, date formatting
```

## Features

- **Card Swiping** - Drag gesture with spring physics, haptic feedback
- **Three Actions** - Learned (right), Save (up), Skip (left)
- **Spaced Repetition** - Research papers resurface with fresh angles
- **Interest Feed** - Infinite scroll of liked/saved content
- **Reading List** - Save papers for deep reading
- **Expertise Tracking** - Level progression per category
- **Push Notifications** - Daily briefing reminders
