import Link from "next/link";

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function Auth() {
    return (
        <div
            className="relative min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50 backdrop-blur-sm" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl bg-white/90 p-8 shadow-2xl ring-1 ring-black/10 dark:bg-slate-900/80 dark:ring-white/5">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                            👋 Welcome to Schoolm8
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            The only portal you'll ever need.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Been here before?
                        </p>
                        <Link
                            href="/auth/signin"
                            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Sign in"
                        >
                            Sign In
                        </Link>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            New around here? Don't worry, we'll show you around.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-200"
                            aria-label="Sign up"
                        >
                            Create Account
                        </Link>
                    </div>

                    <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        By continuing you agree to our{" "}
                        <a className="underline" href="/terms">
                            Terms
                        </a>{" "}
                        and{" "}
                        <a className="underline" href="/privacy">
                            Privacy Policy
                        </a>
                        .
                    </div>
                </div>
            </div>
        </div>
    );
}
