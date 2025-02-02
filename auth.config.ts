/**
 * this file contains the configurations for next auth
 */

import type { NextAuthConfig } from 'next-auth';
 
// exports an authConfig object
// object contains the configuration options for NextAuth.js
export const authConfig = {
  pages: {
    signIn: '/login', // redirect to our customer login page on signin
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) { // if the user is on the dashboard
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl)); // logged in users redirected here
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;