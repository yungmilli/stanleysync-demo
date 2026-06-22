"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const response = await signIn("credentials", {
      email,
      password,
      staySignedIn: String(staySignedIn),
      redirect: false,
      callbackUrl: "/admin",
    });

    if (response?.ok) {
      window.location.href = "/admin";
      return;
    }

    setError("Invalid login credentials.");
    setIsLoading(false);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#64707a]">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white px-3 outline-none transition focus:border-[#c46a29]"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.1em] text-[#64707a]">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 w-full rounded-[0.8rem] border border-[#12212c]/10 bg-white px-3 outline-none transition focus:border-[#c46a29]"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#44515b]">
        <input
          type="checkbox"
          checked={staySignedIn}
          onChange={(event) => setStaySignedIn(event.target.checked)}
          className="h-4 w-4 accent-[#c46a29]"
        />
        Stay signed in on this device
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-[#12212c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b3343] disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading ? "Signing in..." : "Sign in to QuoteFlow"}
      </button>
      {error ? <p className="text-sm text-[#b4514b]">{error}</p> : null}
    </form>
  );
}
