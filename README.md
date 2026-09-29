# MetlholoAI

Developer: Bokang Jobe
Repository: https://github.com/loetolex/MetlholoAI

MetlholoAI is a production-oriented agricultural intelligence platform for Botswana, built as a native-first React Native application with Expo and Firebase.

## Current version

0.1.0 — Foundation / Authentication & Navigation

Implemented:
- Expo SDK 57 + Expo Router
- TypeScript strict foundation
- Centralized light/dark design tokens
- Apple-inspired typography and spacing system
- Reusable accessible UI primitives
- Firebase modular SDK initialization
- Persistent Firebase Authentication state
- Email/password sign-in, sign-up and password reset
- Central AuthProvider and explicit auth state machine
- Central permission model
- Central subscription feature-access model
- Protected, public and onboarding route boundaries
- Error boundary
- TanStack Query server-state foundation
- Zustand client-state foundation
- Initial onboarding flow
- First authenticated five-tab workspace
- Deny-by-default Firestore and Storage rules
- Jest + React Native Testing Library foundation

## Setup

Expo SDK 57 targets React Native 0.86. The current Expo SDK documentation lists Node.js 22.13.x as the minimum for SDK 57.

1. Install dependencies: npm install
2. Create local environment: cp .env.example .env
3. Add the Firebase client configuration values to .env.
4. Start: npm start
5. Verify: npm run typecheck && npm test

Firebase's modular JavaScript SDK is used on the client, with React Native authentication persistence configured through AsyncStorage.

## Security boundary

The React Native bundle is an untrusted client. Never add Firebase Admin credentials, service-account private keys, Gemini/OpenAI API keys, or other server secrets to EXPO_PUBLIC_* variables.

The initial Firestore rules allow users to access only their own user document and prevent client-side changes to role, subscriptionTier, or status. All other collections are deny-by-default until their ownership rules are implemented.

## First working flow

Launch → Authentication → Sign In / Create Account → Firebase Authentication → Email verification → Profile check → Onboarding → Protected five-tab workspace

## Planned implementation sequence

1. Foundation / authentication / navigation — current
2. Profile + real farm creation and ownership
3. Dashboard + weather + alerts + intelligence
4. Crop intelligence + disease/pest detection + AI reports
5. Livestock + poultry + fish + health + feed
6. Inventory + income + expenses + analytics
7. Subscriptions + notifications + offline support
8. Production hardening: security, accessibility, performance, crash handling and App Store configuration

## Verification status

- Repository foundation: IMPLEMENTED
- Firebase rules: IMPLEMENTED
- Local dependency installation: NOT VERIFIED
- TypeScript compilation: NOT VERIFIED
- Jest execution: NOT VERIFIED
- Firebase authentication against a real project: NOT VERIFIED
- iOS simulator/device build: NOT VERIFIED
- Google/Apple sign-in: NOT IMPLEMENTED YET — provider adapters belong in the authentication phase after the email flow is verified