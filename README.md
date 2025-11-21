## Minimal UI ([Free version](https://free.minimals.cc/))

![license](https://img.shields.io/badge/license-MIT-blue.svg)

![preview](public/assets/images/minimal-free-preview.jpg)

> Free React Admin Dashboard made with Material-UI components and React + Vite.js.

## Pages

- [Dashboard](https://free.minimals.cc/)
- [Users](https://free.minimals.cc/user)
- [Products](https://free.minimals.cc/products)
- [Blog](https://free.minimals.cc/blog)
- [Login](https://free.minimals.cc/login)
- [Not found](https://free.minimals.cc/404)

## Quick start

- Clone the repo: `git clone https://github.com/minimal-ui-kit/material-kit-react.git`
- Recommended: `Node.js v20.x`
- **Install:** `npm i` or `yarn install`
- **Start:** `npm run dev` or `yarn dev`
- **Build:** `npm run build` or `yarn build`
- Open browser: `http://localhost:3039`

## Authentication

The application uses Supabase authentication with role-based access control. Test accounts are available:

### Test Accounts

**Admin Account** (Full access - can create all user types)
- **Email:** `admin@test.com`
- **Password:** `admin123`

**Manager Account** (Can create managers and users)
- **Email:** `manager@test.com`
- **Password:** `manager123`

**User Account** (No access to user management)
- **Email:** `user@test.com`
- **Password:** `user123`

### Features
- Sign in with email/password
- Logout functionality
- Session management
- Role-based access control
- Protected routes based on user role
