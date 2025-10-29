import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ShieldCheck, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/", { replace: true });
    }
  }, [isLoading, user, navigate]);

  async function handleGoogleSignIn() {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
      toast({
        title: "Welcome back",
        description: "Authentication successful.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign-in failed",
        description:
          error instanceof Error
            ? error.message
            : "We couldn't complete your sign-in. Please try again.",
      });
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-12 lg:flex-row lg:justify-between">
        <div className="max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium uppercase tracking-widest text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Enterprise-grade security
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Secure access to your Client Manager dashboard
          </h1>
          <p className="text-lg text-slate-200/80">
            Sign in with your Google account to protect client records with
            modern authentication and seamless multi-device support.
          </p>
          <div className="grid gap-4 text-left text-sm text-slate-200/80">
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Lock className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-medium text-white">Two-step ready</p>
                <p className="text-slate-200/70">
                  Works with Google Authenticator for additional verification
                  layers across your organisation.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <Loader2 className="mt-1 h-5 w-5 animate-spin text-emerald-400" />
              <div>
                <p className="font-medium text-white">Automatic session refresh</p>
                <p className="text-slate-200/70">
                  Stay signed in securely with background token rotation and
                  device syncing.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md border-white/10 bg-white/10 text-slate-100 backdrop-blur">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-primary/20 p-3">
              <ShieldCheck className="h-full w-full text-primary" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold text-white">
                Login to continue
              </CardTitle>
              <CardDescription className="text-slate-200/80">
                Authenticate with Google to unlock the Client Manager suite.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              type="button"
              size="lg"
              className="w-full justify-center gap-3 bg-white text-slate-900 hover:bg-white/90"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isLoading}
            >
              {isSigningIn || isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              <span className="font-medium">Sign in with Google</span>
            </Button>
            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-4 text-left text-sm text-slate-200/80">
              <p className="font-medium text-white">Need enhanced security?</p>
              <p>
                Once authenticated, enable two-factor prompts in your Google
                account to pair with Authenticator for instant approvals.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-3 text-center text-xs text-slate-200/60">
            <p>
              Protected by Google OAuth 2.0 with encrypted token exchange and
              secure session storage.
            </p>
            <div className="inline-flex items-center gap-2 text-slate-200/80">
              <span>Need help?</span>
              <a
                href="mailto:support@clientmanager.app"
                className="inline-flex items-center gap-1 text-primary hover:text-primary/80"
              >
                Contact support <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17.3 3 14.9 2 12 2 6.7 2 2.3 6.5 2.3 12S6.7 22 12 22c6.9 0 9.7-4.8 9.7-7.2 0-.5-.1-.9-.2-1.3H12z"
      />
      <path fill="none" d="M2 2h20v20H2z" />
    </svg>
  );
}
