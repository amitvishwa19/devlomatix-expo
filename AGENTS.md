# devlomatix-expo — AGENTS.md

## Stack
- **Expo SDK 54** (new arch enabled), **expo-router** (file-based routing), **React Native 0.81**, **React 19.1**
- **NativeWind v4** + Tailwind CSS v3 — classes go on `className`. Babel: `{ jsxImportSource: 'nativewind' }`. Metro: `withNativeWind(config, { input: './global.css' })`
- **TypeScript** + **JavaScript** mixed — tsconfig extends `expo/tsconfig.base`, path alias `~/*` → `src/*`

## Commands
| Command | Purpose |
|---|---|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android device/emulator (dev client) |
| `npm run ios` | Run on iOS simulator (dev client) |
| `npm run web` | Start Expo with web target |
No test/lint/typecheck scripts in `package.json`. To typecheck: `npx tsc --noEmit`. No CI pipeline configured.

## Key scripts in repo
- `strip-types.js` — converts `.ts/.tsx` → `.js/.jsx` and deletes originals (one-time migration tool)
- `scrub_keys.js` — redacts API keys from `src/utils/constants.js`

## Architecture

### Routing (expo-router file-based, groups under `src/app/`)
- `(auth)/` — login, signup, forgot-password, verify
- `(tabs)/` — home, apps, messages, tasks, activity, settings (custom tab bar at `(tabs)/_layout.jsx`)
- `(modules)/` — sub-app route groups: `crystalaura/`, `curexa/`, `konnectx/`, `solarbright/`, `access-management/`
- `(misc)/` — SplashScreen, sharedpref
- Entrypoint: `src/app/_layout.jsx` (imports `global.css` first). The index route re-exports `(misc)/SplashScreen`.

### Services (each is a self-contained module)
| Service | Location | Description |
|---|---|---|
| KonnectX | `src/services/konnectx/` | Messaging/chat platform (contacts, chats, campaigns, flows, chatbots, templates, analytics, credentials, settings) |
| CrystalAura | `src/services/crystalaura/` | E-commerce (products, orders, stores) |
| Kanban | `src/services/kanban/kanban.js` | Kanban board with task CRUD, checklists, AI description gen |
| Access Mgmt | `src/services/access-management.js` | Auth RBAC (users, roles, permissions) |

Provider components live in `src/providers/` (KonnectxProvider, CrystalAuraProvider).

### Auth
- JWT stored in **SecureStore** (access token) + **AsyncStorage** (session object)
- Axios interceptor auto-attaches `Authorization: Bearer` header via `src/utils/axios.js`
- Google Sign-In supported; Firebase Cloud Messaging for push notifications

### API
- Base URL: `https://dev.devlomatix.com/api/v5` (set in `src/utils/api.js`)
- All API calls go through `src/utils/axios.js` (configured axios instance)
- **EXPO_PUBLIC_*** environment variables used for: Google Maps API key, OpenAI key, Gemini key

### Theme
- Custom `AppTheme` context (`src/theme/AppTheme.jsx`) — persists mode to AsyncStorage under `devlomatix.theme-mode`
- The `palette` object provides Tailwind class names + raw color values for both light/dark modes
- Used via `useAppTheme()` hook

### EAS Build
- projectId: `c0b6af7f-b1a3-4846-a68a-09987207d53d`, owner: `devlomatix-solutions`
- Profiles: `development` (dev client, internal), `preview` (internal), `production`

### Patches
- `patches/@react-native-google-signin+google-signin+16.1.2.patch` — applied via `postinstall` script

### VS Code
- On-save: fix all, organize imports, sort members
- Recommended extension: `expo.vscode-expo-tools`
