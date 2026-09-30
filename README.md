# React + Vite

## Local API integration

The frontend calls `/web/*` through Vite's development proxy. Start `Project.Api` with its `https` launch profile (`https://localhost:7242`), then run `npm run dev` here. The proxy accepts the local development certificate. `VITE_API_BASE_URL` defaults to `/web`; an absolute URL requires API CORS configuration.

Login sends `keyword` and `password` to `/web/auth/login`, then verifies `/web/auth/me`. Tokens stay in Redux memory, so reloading the page requires another login. A 401 can trigger one JSON refresh and one request replay; 403 is displayed without retry. The dashboard requests `/web/rooms` only when `me.permissions` includes permission 4. Signing out clears the local session; the current API has no logout endpoint to revoke tokens.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
