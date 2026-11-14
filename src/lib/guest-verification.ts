// Remembers the identity-check session started before sign-up, so it can be linked to the new account.
const KEY = "astrobit-guest-didit";
export const getGuestSession = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export const setGuestSession = (id: string | null) => { try { id ? localStorage.setItem(KEY, id) : localStorage.removeItem(KEY); } catch { /* ignore */ } };
