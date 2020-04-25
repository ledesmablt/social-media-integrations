# Social Media Integrations Test

Firebase + FB API (pages, events).

## Notes to self
### Security
- Firestore should always, always, always have [**rules**](https://firebase.google.com/docs/firestore/security/get-started).
    - You can also use functions for reusable rules - there's a good [video](https://www.youtube.com/watch?v=b7PUm7LmAOw) on this.
- Keep all calls to external API (esp. those involving client secrets) in cloud functions.
    - Putting client secrets anywhere in the frontend [exposes them](https://github.com/facebook/react/issues/16293) no matter what you do.
    - Store the above as environment variables in `functions.config()`. Code for that is in `./firebase.json > functions.predeploy`.
    - This functions config isn't accessible from the frontend firebase SDK - it produces several dependency errors (I've been there). But that's okay, since we're not supposed to be storing sensitive credentials anywhere in the frontend anyway.
    - This solution has a caveat: **config isn't available locally.** The solution to this is covered in the **Testing, Emulation** section.
    - Never commit your credentials to a git repo, even if private.

### Firebase Component
- It helps a lot to create a [`Firebase`]('src/components/Firebase/firebase.tsx) component that sets up all the config for both dev or prod (base on `NODE_ENV`). That way we can reduce boilerplate code across other components and keep all the Firebase config settings easily accessible.

### Testing, Emulation
- When testing locally, [**emulators**](https://firebase.google.com/docs/rules/emulator-setup) can be set up to avoid conflict with prod data. This creates a locally hosted emulation of the firebase suite, which should be callable from the app with the firebase SDK.
- Functions and other services (firestore, auth, etc.) can be partially set up with `firebase init emulators`.
    - [Emulated functions](https://firebase.google.com/docs/functions/local-emulator) have to be set up properly, especially for environment variables in `functions.config()` to work.
- When testing locally, no need to enable hosting emulation. You may just run the local React server with `yarn start`. Running `firebase serve` with hosting enabled will set `NODE_ENV=production`, which might cause problems.
- Alongside the React server, you may set up and run the emulators for all the services you need with `yarn emulate` (custom script, see `package.json > scripts.emulate`) with the right [credentials setup](https://firebase.google.com/docs/admin/setup).

### Dev and Prod
- Emulators may be tedious to set up, especially when working with auth or databases. An alternative solution is to just [set up different projects](https://stackoverflow.com/questions/37450439/separate-dev-and-prod-firebase-environment) for different environments. Crude, but it works.