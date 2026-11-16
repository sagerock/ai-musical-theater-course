// Headers for calls to our own /api routes. The routes only answer signed-in
// users, so every request carries the caller's Firebase ID token.
import { auth } from '../config/firebase';

export async function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const user = auth.currentUser;
  if (user) {
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }
  return headers;
}
