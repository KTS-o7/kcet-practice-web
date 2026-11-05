import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { RecoveryCodeCard } from "../components/RecoveryCode";
import { ThemeToggle, Wordmark } from "../components/Shell";
import { Spinner } from "../components/ui";
import { api, ApiError } from "../lib/api";
import { CONTACT_EMAIL, contactHref } from "../lib/contact";
import { qk } from "../lib/queries";
import type { User } from "../lib/types";

type Mode = "login" | "signup" | "reset";
type Field = "username" | "code" | "password" | "confirm" | "form";

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const remembered = (() => {
    try {
      return localStorage.getItem("kaagada-user") ?? "";
    } catch {
      return "";
    }
  })();
  const [mode, setMode] = useState<Mode>(remembered ? "login" : "signup");
  const [username, setUsername] = useState(remembered);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [analytics, setAnalytics] = useState(true); // on by default; students can untick it
  const [error, setError] = useState<{ field: Field; msg: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  // After sign-up or a reset: the new recovery code, shown once before going on.
  const [saved, setSaved] = useState<{
    code: string;
    name: string;
    after: "signup" | "reset";
  } | null>(null);
  const signup = mode === "signup";
  const reset = mode === "reset";
  const newPassword = signup || reset;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPassword("");
    setConfirm("");
    setCode("");
  };

  const goOn = () => {
    const next = params.get("next");
    navigate(
      next && next.startsWith("/") && !next.startsWith("//") ? next : "/",
      { replace: true },
    );
  };

  const remember = (name: string) => {
    try {
      localStorage.setItem("kaagada-user", name);
    } catch {
      /* ignore */
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (username.trim().length < 2)
      return setError({
        field: "username",
        msg: "Enter your name (at least 2 letters).",
      });
    if (reset && code.replace(/[^a-z0-9]/gi, "").length !== 12)
      return setError({
        field: "code",
        msg: "The recovery code has 12 letters and numbers, like ABCD-EFGH-JKMN.",
      });
    if (newPassword && password.length < 6)
      return setError({ field: "password", msg: "Use at least 6 characters." });
    if (!password)
      return setError({ field: "password", msg: "Enter your password." });
    if (newPassword && confirm !== password)
      return setError({
        field: "confirm",
        msg: "The two passwords don’t match.",
      });
    setBusy(true);
    setError(null);
    try {
      if (signup || reset) {
        const res = signup
          ? await api.signup(username.trim(), password, analytics)
          : await api.reset(username.trim(), code, password);
        remember(res.name);
        const user: User = {
          id: res.id,
          name: res.name,
          admin: res.admin,
          has_recovery: true,
          analytics: res.analytics,
          analytics_id: res.analytics_id,
        };
        if (signup) qc.setQueryData(qk.me, user);
        else await qc.invalidateQueries({ queryKey: qk.me });
        setSaved({
          code: res.recovery_code,
          name: res.name,
          after: signup ? "signup" : "reset",
        });
      } else {
        const user = await api.login(username.trim(), password);
        remember(user.name);
        qc.setQueryData(qk.me, user);
        // login doesn't say whether a recovery code exists; let /api/me fill it in
        void qc.invalidateQueries({ queryKey: qk.me });
        goOn();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      if (err instanceof ApiError && err.status === 401)
        setError({ field: reset ? "code" : "password", msg });
      else if (
        err instanceof ApiError &&
        (err.status === 400 || err.status === 409)
      )
        setError({
          field: msg.toLowerCase().includes("password")
            ? "password"
            : "username",
          msg,
        });
      else setError({ field: "form", msg });
      setPassword("");
      setConfirm("");
    } finally {
      setBusy(false);
    }
  };

  const tab = (m: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => switchMode(m)}
      className={`h-9 flex-1 rounded-[7px] text-label transition-colors ${
        mode === m
          ? "bg-raised font-semibold text-ink shadow-[0_1px_0_var(--color-line)]"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  const errFor = (f: Field) => (error?.field === f ? "login-err" : undefined);

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <main className={`w-full ${saved ? "max-w-[420px]" : "max-w-[360px]"}`}>
        <div className="mb-7 text-center">
          <h1 className="text-[44px] leading-[48px]">
            <Wordmark />
          </h1>
          <p className="mt-1 text-label text-muted">
            <span lang="kn">ಕಾಗದ</span> · KCET practice
          </p>
        </div>
        {saved ? (
          <div className="card relative overflow-hidden p-6">
            <RecoveryCodeCard
              code={saved.code}
              name={saved.name}
              title={
                saved.after === "reset"
                  ? "Password changed. Here’s your new code"
                  : "Save your recovery code"
              }
              intro={
                saved.after === "reset"
                  ? "The code you just used is spent. This is your new one: keep it safe for next time. Other devices were signed out."
                  : undefined
              }
              doneLabel={
                saved.after === "reset" ? "Continue" : "Start practising"
              }
              onDone={goOn}
            />
          </div>
        ) : (
          <form
            onSubmit={submit}
            noValidate
            className="card relative overflow-hidden p-6"
          >
            {/* notebook margin rule */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-3 w-px bg-wrong/25"
            />
            {reset ? (
              <div className="mb-5">
                <button
                  type="button"
                  className="link inline-flex items-center gap-1.5 text-label"
                  onClick={() => switchMode("login")}
                >
                  <ArrowLeftIcon size={14} aria-hidden /> Back to log in
                </button>
                <h2 className="mt-3 text-h2">Forgot your password?</h2>
                <p className="mt-1 text-label font-normal text-muted">
                  Use the recovery code you saved when you made your account.
                  Lost it? Email{" "}
                  <a
                    className="link"
                    href={contactHref("Kaagada: lost my recovery code")}
                  >
                    {CONTACT_EMAIL}
                  </a>{" "}
                  with your name on the site.
                </p>
              </div>
            ) : (
              <div
                role="tablist"
                aria-label="Account"
                className="mb-5 flex gap-1 rounded-[9px] border border-line bg-paper p-1"
              >
                {tab("login", "Log in")}
                {tab("signup", "Create account")}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="label mb-1.5 block">
                  Your name
                </label>
                <input
                  id="username"
                  className="field"
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  aria-invalid={error?.field === "username"}
                  aria-describedby={errFor("username")}
                />
              </div>
              {reset && (
                <div>
                  <label htmlFor="code" className="label mb-1.5 block">
                    Recovery code
                  </label>
                  <input
                    id="code"
                    className="field font-mono tracking-[0.08em] uppercase"
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="XXXX-XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    aria-invalid={error?.field === "code"}
                    aria-describedby={errFor("code")}
                  />
                </div>
              )}
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="password" className="label block">
                    {signup
                      ? "Choose a password"
                      : reset
                        ? "New password"
                        : "Password"}
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      className="link text-caption"
                      onClick={() => switchMode("reset")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  className="field"
                  autoComplete={
                    newPassword ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={error?.field === "password"}
                  aria-describedby={
                    errFor("password") ?? (newPassword ? "pw-hint" : undefined)
                  }
                />
                {newPassword && (
                  <p id="pw-hint" className="caption mt-1 text-muted">
                    At least 6 characters. You’ll use it to log in on any
                    device.
                  </p>
                )}
              </div>
              {newPassword && (
                <div>
                  <label htmlFor="confirm" className="label mb-1.5 block">
                    Type it again
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    className="field"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    aria-invalid={error?.field === "confirm"}
                    aria-describedby={errFor("confirm")}
                  />
                </div>
              )}
              {signup && (
                <label className="flex cursor-pointer items-start gap-2.5 text-label font-normal">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                  />
                  <span>
                    Help improve Kaagada: allow usage analytics while I’m logged
                    in. My name is never sent.{" "}
                    <span className="text-muted">
                      I’m 18 or older, or my parent or guardian agrees. You can
                      change this any time.
                    </span>
                  </span>
                </label>
              )}
              <p
                id="login-err"
                role="alert"
                aria-live="assertive"
                className="min-h-[18px] text-label font-medium text-wrong"
              >
                {error?.msg}
              </p>
              <button
                type="submit"
                className="btn btn-primary h-11 w-full"
                disabled={busy}
              >
                {busy ? <Spinner /> : null}
                {busy
                  ? signup
                    ? "Creating account"
                    : reset
                      ? "Setting new password"
                      : "Logging in"
                  : signup
                    ? "Create account"
                    : reset
                      ? "Set new password"
                      : "Log in"}
                {!busy && <ArrowRightIcon size={16} aria-hidden />}
              </button>
            </div>
          </form>
        )}
        <p className="caption mx-auto mt-4 max-w-[360px] text-center text-muted">
          Kaagada uses PostHog analytics (with cookies) to see how the site is
          used, never with your name. You can turn it off any time on the
          Account page. Questions or problems?{" "}
          <a className="link" href={contactHref("Kaagada")}>
            {CONTACT_EMAIL}
          </a>
        </p>
      </main>
    </div>
  );
}
