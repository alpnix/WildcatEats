"use client";

import { clsx } from "clsx";

export function LogoutButton() {
  return (
    <form action="/api/auth/sign-out" method="POST">
      <button
        type="submit"
        className={clsx(
          "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
          "text-ink/75 hover:bg-cardinal hover:text-paper"
        )}
      >
        Log Out
      </button>
    </form>
  );
}
