export type AdminRole = "admin" | "viewer";

export type AdminSession =
  | { authenticated: true; role: AdminRole }
  | { authenticated: false };
