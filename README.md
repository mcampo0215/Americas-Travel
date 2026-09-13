# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   To start on the iOS simulator with a clean bundler cache:

   ```bash
   npm run ios -- --clear
   ```

   Use `npx expo` or the npm scripts so the CLI matches this project's Expo SDK.
   A bare `expo` command can run an older globally installed version and fail
   to bundle Expo Router with an `EXPO_ROUTER_APP_ROOT` error.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

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

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
