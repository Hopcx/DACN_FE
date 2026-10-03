# React + Vite

## Local API integration

The frontend calls `/web/*` on the same origin through Vite's development proxy. Start `Project.Api` with its `https` launch profile (`https://localhost:7242`), then run `npm run dev` here. The proxy accepts the local API development certificate. The API base path is `/web`.

Auth POSTs first fetch `/web/auth/csrf`, then send `X-CSRF-TOKEN`. Login returns only a short-lived access JWT in JSON; the refresh token is a Secure/HttpOnly/SameSite=Lax cookie scoped to `/web/auth`. Redux keeps the access JWT in memory. After reload, the route guard attempts cookie refresh, then `/web/auth/me`. A 401 can trigger one cookie refresh and one replay; 403 is displayed without retry. Logout calls `/web/auth/logout` to revoke refresh and the current access jti, then clears memory.

Development requires HTTPS on both Vite and the API. Set `DACN_DEV_PFX_PATH` to a local PFX development certificate and `DACN_DEV_PFX_PASSWORD` in your shell; the file is ignored by Git. Start Vite at `https://localhost:5173`, with `/web` proxied to API `https://localhost:7242`. These variables are consumed only by the Vite Node config, not exposed through `import.meta.env`. The API development mail sender writes verification links to ignored `Project.Api/.maildrop/` if no SMTP provider is configured. Production requires `Mail__SmtpHost`, `Mail__SmtpPort`, `Mail__SmtpUser`, `Mail__SmtpPassword`, `Mail__From`, `Mail__PublicFrontendUrl`, and `Security__AllowedOrigins__0` (HTTPS FE origin) in secure environment configuration. Apply/review the auth migration and existing-user email verification plan before enabling new login behavior.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
