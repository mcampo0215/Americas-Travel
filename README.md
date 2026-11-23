<div align="center">

<img src="docs/readme/hero.gif" alt="America&#x27;s Travel: animated travel illustration" width="1040" />

# America's Travel

**From the first sale to the daily report.**

<img src="docs/readme/stack.svg" alt="Expo 56 / React Native / TypeScript / Firebase" />

[Overview](#overview) &nbsp; · &nbsp; [Run locally](#run-locally) &nbsp; · &nbsp; [Explore the repository](https://github.com/mcampo0215/Americas-Travel)

</div>

---

## Overview

A sales and inventory app for America's Travel Express. Staff can browse a shared product catalog, record sales, track stock and revenue, and generate daily PDF reports. The interface includes a welcome flow, themed screens, sales insights, and milestone animations.

| Manage stock | Track the day | Share a report |
| :--- | :--- | :--- |
| Browse catalog items and adjust account-scoped local inventory. | Record sales and review units sold, revenue, and history. | Generate, print, or share a daily revenue PDF. |

## Run locally

Use Node.js 22 from `.nvmrc` (the package also permits Node 20), then:

```sh
npm ci
npx expo start
```

For the iOS simulator with a clean bundler cache:

```sh
npm run ios -- --clear
```

Use the local `npx expo` CLI or npm scripts. A globally installed older Expo CLI can produce an `EXPO_ROUTER_APP_ROOT` bundling error. The project uses Expo SDK 56; see the [versioned Expo reference](https://docs.expo.dev/versions/v56.0.0/).

## How the app is organized

| Source | Responsibility |
| :--- | :--- |
| [src/app/](src/app/) | Expo Router screens for inventory, sales insights, and settings. |
| [src/providers/auth-session.tsx](src/providers/auth-session.tsx) | Firebase authentication and session state. |
| [src/providers/inventory-store.tsx](src/providers/inventory-store.tsx) | Catalog retrieval, account-scoped local sales, stock, and revenue history. |
| [src/utils/revenue-report.ts](src/utils/revenue-report.ts) | PDF creation, sharing, and printing. |
| [docs/device-layout-validation.md](docs/device-layout-validation.md) | Device layout validation notes. |

## Checks

```sh
node --test tests/account-isolation.test.cjs
node --test tests/device-layout.test.cjs
npm run test:rules
```

The rules command needs the Firebase CLI and the Firestore emulator prerequisites. It uses the demo test project from `firebase.test.json`.

## Authentication Setup

Every fresh app launch or browser reload shows a three-step welcome flow. Email/password login, account
creation, password reset, and sign-out use Firebase Authentication. Enable
**Authentication > Sign-in method > Email/Password** in the `americas-travel`
Firebase console before using these flows. Review Authentication's authorized
domains for your web deployment and password policy before release.

Onboarding completion lasts only for the current session; returning from the
background does not restart it. Old saved completion flags are ignored.
Firebase restores login sessions
on web and uses AsyncStorage persistence on native. Passwords are passed directly
to Firebase and are not saved by the app.

Account creation returns to login. Sales, stock counts, and revenue history are
stored locally under each Firebase user's UID, and reset in memory when accounts
change. The old shared storage is never assigned to an account. Cloud sales sync
is not implemented.

## Repository and Firebase security

Environment files, logs, Firebase CLI caches, and common administrator credential
filenames are ignored by Git. Only commit environment examples with placeholder
values. Never put service-account keys or other private credentials in app code.

The Firebase client configuration in `src/lib/firebase.ts` is intentionally public;
it identifies the project and does not grant database access. Restrict its Google
Cloud API key to Firebase-related APIs, including Authentication and Firestore.
Do not enable unrelated APIs such as Gemini on that key. Moving client config into
`EXPO_PUBLIC_` variables would not hide it from the compiled app.

`firestore.rules` permits signed-in users to read top-level catalog documents in
collection `1`. All client writes and all other document paths are denied. Any
self-registered account can read this catalog; it must contain only shared product
information, never private sales or customer information.

Deploy rules with `firebase deploy --only firestore:rules --project americas-travel`.
Run the access-control tests with `npm run test:rules` and the account tests with
`node --test tests/account-isolation.test.cjs`.

The catalog maintenance script uses the Firebase Admin SDK and requires an IAM
identity with Firestore access. Set up Application Default Credentials outside the
repository (`gcloud auth application-default login`), then run
`node scripts/update-firestore-image-urls.mjs`. Administrator access bypasses client
rules; never distribute these credentials with the app.

---

<p align="center"><a href="#americas-travel">Back to the top</a></p>
