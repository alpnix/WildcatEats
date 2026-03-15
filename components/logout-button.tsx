"use client";

export function LogoutButton() {
  return (
    <form action="/api/auth/sign-out" method="POST">
      <button type="submit" className="nav-link">
        Log Out
      </button>
    </form>
  );
}
