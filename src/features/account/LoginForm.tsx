"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useGlobalError } from "@/features/shared/errors/GlobalErrorProvider";

export function LoginForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { reportError } = useGlobalError();
  const init = useMemo(() => {
    try {
      return { client: createBrowserSupabaseClient(), error: "" };
    } catch (caught) {
      return {
        client: null,
        error: caught instanceof Error ? caught.message : "Supabase configuration missing",
      };
    }
  }, []);

  useEffect(() => {
    if (!init.client) {
      return;
    }

    const supabase = init.client;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/");
      }
    };

    void checkSession();
  }, [init, router]);

  useEffect(() => {
    if (!init.error) {
      return;
    }

    reportError(init.error);
  }, [init.error, reportError]);

  useEffect(() => {
    if (!error) {
      return;
    }

    reportError(error);
  }, [error, reportError]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const activeIdentifier = mode === "login" ? identifier.trim() : email.trim();

    if (!activeIdentifier || !password || (mode === "register" && !username.trim())) {
      setError(mode === "login" ? "Please enter both username and password" : "Please enter email, username, and password");
      return;
    }

    if (!init.client) {
      setError(init.error || "Supabase configuration missing");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            username: username.trim(),
            password,
          }),
        });
        const payload = (await response.json()) as { error?: string; requiresEmailConfirmation?: boolean };
        if (!response.ok) {
          throw new Error(payload.error ?? "Registration failed");
        }

        if (payload.requiresEmailConfirmation) {
          setMode("login");
          setIdentifier(username.trim().toLowerCase());
          setNotice("Account created. Check your email to confirm your account, then log in.");
          return;
        }

        router.replace("/");
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Authentication failed");
      }

      router.replace("/");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Penny Clipper</h1>
          <p className="muted">Get on your big yahu timing ❗</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="error-message" role="alert" aria-live="assertive">
              {error}
            </div>
          ) : null}

          <div className="form-group">
            <label htmlFor={mode === "login" ? "identifier" : "email"}>{mode === "login" ? "Username or Email" : "Email"}</label>
            {mode === "login" ? (
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Enter your username"
                disabled={loading}
                autoComplete="username"
              />
            ) : (
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                autoComplete="email"
              />
            )}
          </div>

          {mode === "register" ? (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value.toLowerCase())}
                placeholder="username"
                disabled={loading}
                autoComplete="username"
              />
            </div>
          ) : null}

          {mode === "register" ? <p className="muted">Usernames must be unique and use 3-24 lowercase letters, numbers, or underscores.</p> : null}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {notice ? <p className="muted">{notice}</p> : null}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setNotice("");
              setIdentifier("");
              setEmail("");
              setUsername("");
              setPassword("");
            }}
          >
            {mode === "login" ? "Don't have an account? Create one" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
