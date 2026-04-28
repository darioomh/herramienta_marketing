<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fe81c40c-78fb-4fb3-bc28-015b26f3390c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying outside AI Studio (Vercel, etc.)

The app uses Firebase Authentication with Google as the provider. Firebase only
allows the sign-in popup/redirect from explicitly authorized domains. AI Studio's
domain is authorized automatically, so login works there out of the box.

When you deploy to Vercel (or any other host), you must register the deployed
domain so Google login works:

1. Open Firebase Console → Authentication → Settings → **Authorized domains**:
   https://console.firebase.google.com/project/gen-lang-client-0636976968/authentication/settings
2. Add every domain that will serve the app, for example:
   - `your-app.vercel.app` (production)
   - your custom domain, if any
   - any preview domain you want to test against (Vercel previews use unique
     subdomains; add the ones you actually use)
3. In Google Cloud Console → APIs & Services → Credentials, open the OAuth 2.0
   Client ID Firebase created for this project and confirm the Vercel domain is
   listed under both **Authorized JavaScript origins** and
   **Authorized redirect URIs** (`https://<domain>/__/auth/handler`).

If a domain is missing you will see `auth/unauthorized-domain` in the browser
console and the inline error banner under the "Sign in with Google" button.
