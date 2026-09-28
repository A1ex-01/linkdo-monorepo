# Linkdo mobile (read-only)

This is the Linkdo mobile companion, built with [Expo](https://expo.dev) and [React Native Reusables](https://reactnativereusables.com). It uses the same email-code login and API as `apps/desktop`.

It was initialized using the following command, then the `Clerk auth (Nativewind)` template was selected when prompted:

```bash
npx @react-native-reusables/cli@latest init
```

## Getting Started

Before running the app, make sure to:

1. Copy `.env.example` to `.env.local`.
2. Set `EXPO_PUBLIC_LINKDO_API_URL` to the Linkdo API base URL. The production default is `https://api.a1ex.online`.
3. Run the app with one of the commands below and sign in with the same email used in Linkdo desktop.

Then start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This will launch the Expo Go Server. You can open the app with:

- **iOS**: press `i` to launch in the iOS simulator (Mac only)
- **Android**: press `a` to launch in the Android emulator
- **Web**: press `w` to run in a browser

Or scan the QR code with the [Expo Go](https://expo.dev/go) app to test on your device.

## Read-only boundary

The app deliberately has no create, update, move, import, focus-timer, authorization, or delete API calls. It can read:

- Lists, task cards, descriptions, status, schedules, and time totals
- Notion and ClickUp connection indicators
- Seven-day report summary, top tasks, and focus sessions
- Account identity

## iOS task widget

The iOS `Linkdo 任务` home-screen widget shows a snapshot of today, this week, and backlog tasks. It is refreshed when the list screen loads or is pulled to refresh.

It requires an iOS development build because `expo-widgets` is not available in Expo Go. The widget has medium and large layouts and is registered in `app.json`.

## Included screens

- Email-code sign in and secure token persistence
- List overview and read-only task board
- Reports and focus sessions
- Account and integration overview
- iOS task-list widget

## Project Features

- ⚛️ Built with [Expo Router](https://expo.dev/router)
- 🔐 Email-code authentication shared with Linkdo desktop
- 🎨 Styled with [Tailwind CSS](https://tailwindcss.com/) via [Nativewind](https://www.nativewind.dev/)
- 📦 UI powered by [React Native Reusables](https://github.com/founded-labs/react-native-reusables)
- 🚀 New Architecture enabled
- 🔥 Edge to Edge enabled
- 📱 Runs on iOS, Android, and Web

## Learn More

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Expo Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)

---

If this template helps you move faster, consider giving [React Native Reusables](https://github.com/founded-labs/react-native-reusables) a ⭐ on GitHub. It helps a lot!
