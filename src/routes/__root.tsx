import {
  createRootRoute,
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks";

export const Route = createRootRoute({
  component: RootLayout,
});

function DisclaimerDialog() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("disclaimer_seen")) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70">
      <div className="mx-4 max-w-lg rounded-lg bg-surface p-6">
        <h2 className="text-lg font-semibold text-accent-warm">
          Important Disclaimer
        </h2>
        <p className="mt-3 text-sm text-text-secondary leading-relaxed">
          Inner Compass is a personal reflection tool designed to support your
          self-exploration journey. It is{" "}
          <strong className="text-text-primary">not</strong> a medical device,
          diagnostic tool, or substitute for professional mental health care.
        </p>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          If you are experiencing psychological distress, please reach out to a
          qualified mental health professional or contact a crisis helpline in
          your area.
        </p>
        <button
          onClick={() => {
            localStorage.setItem("disclaimer_seen", "1");
            setVisible(false);
          }}
          className="mt-4 w-full rounded bg-accent-warm px-4 py-2 text-sm font-medium text-background"
        >
          I understand
        </button>
      </div>
    </div>
  );
}

function RootLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!user && location.pathname !== "/login") {
      navigate({ to: "/login" });
    }
    if (user && location.pathname === "/login") {
      navigate({ to: "/" });
    }
  }, [user, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <header className="sticky top-0 z-50 border-b border-surface bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold text-accent-warm">
            Inner Compass
          </Link>
          {user && (
            <button
              onClick={signOut}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-surface py-3">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <p className="text-xs text-text-secondary">
            Personal reflection tool, not a medical device.
          </p>
          {user && (
            <Link
              to="/profile"
              className="text-xs text-text-secondary hover:text-accent-warm transition-colors"
            >
              Profile
            </Link>
          )}
        </div>
      </footer>

      <DisclaimerDialog />
    </div>
  );
}
