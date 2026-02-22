"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  ShieldAlert,
  KeyRound,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldEllipsis,
  Trash2,
  UserCircle2,
  X,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordEntry = {
  id: string;
  username: string;
  password: string;
  updatedAt: string;
};

type AuthFormState = { email: string; password: string };
type VaultFormState = { username: string; password: string };
type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };
type ResetPasswordForm = { newPassword: string; confirmPassword: string };
type User = { userId: string; email: string };
type Health = { total: number; weak: number; reused: number; old: number };

const initialAuthForm: AuthFormState = { email: "", password: "" };
const initialVaultForm: VaultFormState = { username: "", password: "" };
const initialChangePasswordForm: ChangePasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};
const initialResetPasswordForm: ResetPasswordForm = { newPassword: "", confirmPassword: "" };

function getStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return "Weak";
  if (score <= 4) return "Medium";
  return "Strong";
}

function parseError(result: unknown, fallback: string) {
  if (!result || typeof result !== "object") return fallback;
  const obj = result as { message?: string; error?: string };
  return [obj.message, obj.error].filter(Boolean).join(": ") || fallback;
}

function DialogShell({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="size-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [authForm, setAuthForm] = useState<AuthFormState>(initialAuthForm);
  const [vaultForm, setVaultForm] = useState<VaultFormState>(initialVaultForm);
  const [changePasswordForm, setChangePasswordForm] = useState(initialChangePasswordForm);
  const [resetPasswordForm, setResetPasswordForm] = useState(initialResetPasswordForm);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [length, setLength] = useState(16);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [health, setHealth] = useState<Health>({ total: 0, weak: 0, reused: 0, old: 0 });
  const [breach, setBreach] = useState<{ breached: boolean; count: number } | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [visibleMap, setVisibleMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openChangeDialog, setOpenChangeDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);

  const passwordStrength = useMemo(() => getStrength(vaultForm.password), [vaultForm.password]);

  const filteredEntries = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((entry) => entry.username.toLowerCase().includes(term));
  }, [entries, search]);

  function pushToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  async function fetchCurrentUser() {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) {
        setUser(null);
        return;
      }
      setUser(result.user);
    } finally {
      setAuthChecked(true);
    }
  }

  async function loadEntries() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/passwords", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Failed to load entries"));
      setEntries(result.entries);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadHealth() {
    if (!user) return;
    try {
      const response = await fetch("/api/passwords/health", { cache: "no-store" });
      const result = await response.json();
      if (response.ok) {
        setHealth(result.health);
      }
    } catch {
      // keep UI resilient if health endpoint is unavailable
    }
  }

  useEffect(() => {
    void fetchCurrentUser();
  }, []);

  useEffect(() => {
    void loadEntries();
    void loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT";

      if (!isTyping && event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (!isTyping && event.key.toLowerCase() === "n" && user) {
        event.preventDefault();
        usernameInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setOpenUserMenu(false);
        setOpenChangeDialog(false);
        setOpenResetDialog(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [user]);

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Authentication failed"));

      setUser(result.user);
      setAuthForm(initialAuthForm);
      pushToast(mode === "login" ? "Logged in" : "Account created");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setEntries([]);
    setOpenUserMenu(false);
    pushToast("Logged out");
  }

  async function handleGeneratePassword(setter: (value: string) => void) {
    try {
      const response = await fetch("/api/passwords/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ length }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Failed to generate password"));
      setter(result.password);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleVaultSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: vaultForm.username, password: vaultForm.password, folder: "General", tags: [] }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Failed to save credential"));

      setVaultForm(initialVaultForm);
      setEntries((current) => [result.entry, ...current]);
      void loadHealth();
      pushToast("Credential added");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      const response = await fetch(`/api/passwords/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Failed to delete entry"));

      setEntries((current) => current.filter((entry) => entry.id !== id));
      void loadHealth();
      pushToast("Credential deleted");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleBreachCheck(value: string) {
    setError(null);
    setBreach(null);
    try {
      const response = await fetch("/api/passwords/breach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: value }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Breach check failed"));
      setBreach(result);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    setChangingPassword(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Failed to change password"));

      setChangePasswordForm(initialChangePasswordForm);
      setOpenChangeDialog(false);
      pushToast("Password changed");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      setError("Reset password and confirm password do not match");
      return;
    }

    setResettingPassword(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPasswordForm.newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(parseError(result, "Failed to reset password"));

      setResetPasswordForm(initialResetPasswordForm);
      setOpenResetDialog(false);
      pushToast("Password reset");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setResettingPassword(false);
    }
  }

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast("Password copied");
    } catch {
      setError("Failed to copy password");
    }
  }

  if (!authChecked) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {toast ? (
        <div className="fixed right-4 top-4 z-[60] rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary shadow-lg">
          {toast}
        </div>
      ) : null}

      <nav className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Vault OS</p>
            <p className="hidden text-sm text-muted-foreground sm:block">Secure password manager</p>
          </div>

          <div className="relative flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setOpenUserMenu((current) => !current)}
                  aria-label="Open account menu"
                >
                  <UserCircle2 className="size-5" />
                </Button>
                {openUserMenu ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 cursor-default bg-transparent"
                      onClick={() => setOpenUserMenu(false)}
                      aria-label="Close account menu"
                    />
                    <div className="absolute right-0 top-12 z-40 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-3 shadow-xl">
                      <p className="mb-3 truncate text-sm font-medium">{user.email}</p>
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            setOpenUserMenu(false);
                            setOpenChangeDialog(true);
                          }}
                        >
                          <KeyRound className="size-4" />
                          Change Password
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            setOpenUserMenu(false);
                            setOpenResetDialog(true);
                          }}
                        >
                          <ShieldEllipsis className="size-4" />
                          Reset Password
                        </Button>
                        <Button variant="destructive" className="justify-start" onClick={handleLogout}>
                          <LogOut className="size-4" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Password Manager</h1>
          <p className="text-sm text-muted-foreground">
            {user ? "Shortcuts: / search, N add credential, Esc close dialogs." : "Login to access your private vault."}
          </p>
        </header>

        {error ? (
          <Card className="mb-5 border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {!user ? (
          <section className="mx-auto max-w-md">
            <Card className="border-border/70 bg-card/95 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  {mode === "login" ? "Welcome Back" : "Create Account"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <Button type="button" variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>
                    Login
                  </Button>
                  <Button type="button" variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>
                    Register
                  </Button>
                </div>

                <form className="space-y-4" onSubmit={handleAuthSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">Email</Label>
                    <Input
                      id="auth-email"
                      type="email"
                      placeholder="user@example.com"
                      value={authForm.email}
                      onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <Input
                      id="auth-password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={authForm.password}
                      onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={authSubmitting}>
                    {authSubmitting ? "Processing..." : mode === "login" ? "Login" : "Create account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <Card className="border-border/70 bg-card/95 shadow-md">
              <CardHeader>
                <CardTitle>Add Credential</CardTitle>
                <CardDescription>Store username/email and password.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleVaultSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username / Email</Label>
                    <Input
                      id="username"
                      ref={usernameInputRef}
                      placeholder="account username"
                      value={vaultForm.username}
                      onChange={(event) => setVaultForm((current) => ({ ...current, username: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <span className="text-xs text-muted-foreground">Strength: {passwordStrength}</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="text"
                        value={vaultForm.password}
                        onChange={(event) => setVaultForm((current) => ({ ...current, password: event.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleGeneratePassword((value) => setVaultForm((current) => ({ ...current, password: value })))}
                        aria-label="Generate password"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleBreachCheck(vaultForm.password)}
                      >
                        <ShieldAlert className="size-4" />
                        Breach
                      </Button>
                    </div>
                    {breach ? (
                      <p className="text-xs text-muted-foreground">
                        {breach.breached
                          ? `Found in breaches (${breach.count}). Avoid this password.`
                          : "No breach match found."}
                      </p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Password length</span>
                      <span>{length}</span>
                    </div>
                    <Input type="range" min={8} max={64} value={length} onChange={(event) => setLength(Number(event.target.value))} />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    <Plus className="size-4" />
                    {submitting ? "Saving..." : "Save Credential"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/95 shadow-md">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>My Credentials</CardTitle>
                    <CardDescription>
                      {loading ? "Loading entries..." : `${filteredEntries.length} result(s) from ${entries.length}`}
                    </CardDescription>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Health: {health.total} total, {health.weak} weak, {health.reused} reused, {health.old} old
                    </p>
                  </div>
                  <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      className="pl-9"
                      placeholder="Search by username/email"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No matching credentials found.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredEntries.map((entry) => {
                      const isVisible = visibleMap[entry.id] ?? false;
                      return (
                        <div key={entry.id} className="rounded-xl border border-border/70 bg-background/70 p-4 shadow-sm">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{entry.username}</p>
                              <p className="text-xs text-muted-foreground">
                                Updated {new Date(entry.updatedAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setVisibleMap((current) => ({ ...current, [entry.id]: !isVisible }))}
                                aria-label="Toggle password visibility"
                              >
                                {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(entry.password)}
                                aria-label="Copy password"
                              >
                                <Copy className="size-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDelete(entry.id)}
                                aria-label="Delete entry"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="rounded-lg border border-border bg-card px-3 py-2 font-mono text-sm">
                            {isVisible ? entry.password : "*".repeat(Math.max(8, entry.password.length))}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <DialogShell
        open={openChangeDialog}
        title="Change Password"
        description="Use your current password to set a new one."
        onClose={() => setOpenChangeDialog(false)}
      >
        <form className="space-y-3" onSubmit={handleChangePassword}>
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={changePasswordForm.currentPassword}
              onChange={(event) =>
                setChangePasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={changePasswordForm.newPassword}
              onChange={(event) =>
                setChangePasswordForm((current) => ({ ...current, newPassword: event.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-change-password">Confirm new password</Label>
            <Input
              id="confirm-change-password"
              type="password"
              value={changePasswordForm.confirmPassword}
              onChange={(event) =>
                setChangePasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={changingPassword}>
            {changingPassword ? "Updating..." : "Change password"}
          </Button>
        </form>
      </DialogShell>

      <DialogShell
        open={openResetDialog}
        title="Reset Password"
        description="Set a completely new account password while logged in."
        onClose={() => setOpenResetDialog(false)}
      >
        <form className="space-y-3" onSubmit={handleResetPassword}>
          <div className="space-y-2">
            <Label htmlFor="reset-new-password">New password</Label>
            <div className="flex gap-2">
              <Input
                id="reset-new-password"
                type="password"
                value={resetPasswordForm.newPassword}
                onChange={(event) =>
                  setResetPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                }
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  handleGeneratePassword((value) =>
                    setResetPasswordForm((current) => ({ ...current, newPassword: value, confirmPassword: value })),
                  )
                }
                aria-label="Generate reset password"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-reset-password">Confirm new password</Label>
            <Input
              id="confirm-reset-password"
              type="password"
              value={resetPasswordForm.confirmPassword}
              onChange={(event) =>
                setResetPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={resettingPassword}>
            {resettingPassword ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </DialogShell>
    </div>
  );
}
