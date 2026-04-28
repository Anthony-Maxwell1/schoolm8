"use client";

import Link from "next/link";
import { useCss } from "@/lib/css";

const backgroundImage = "/images/backgrounds/builtin/onboarding.png";

export default function Auth() {
    const { css } = useCss();
    const style = css.app.auth.page;

    return (
        <div
            className={style.main["ROOT-STYLE"]}
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className={style.main.overlay["ROOT-STYLE"]} />

            <div className={style.main.shell["ROOT-STYLE"]}>
                <div className={style.main.card["ROOT-STYLE"]}>
                    <div className={style.main.intro["ROOT-STYLE"]}>
                        <h1 className={style.main.title["ROOT-STYLE"]}>
                            {style.main.title.CONTENT}
                        </h1>
                        <p className={style.main.subtitle["ROOT-STYLE"]}>
                            {style.main.subtitle.CONTENT}
                        </p>
                    </div>

                    <div className={style.main.body["ROOT-STYLE"]}>
                        <p className={style.main.prompt["ROOT-STYLE"]}>Been here before?</p>
                        <Link
                            href="/auth/signin"
                            className={style.main.primaryLink["ROOT-STYLE"]}
                            aria-label="Sign in"
                        >
                            {style.main.primaryLink.CONTENT}
                        </Link>
                        <p className={style.main.prompt["ROOT-STYLE"]}>
                            New around here? Don't worry, we'll show you around.
                        </p>
                        <Link
                            href="/auth/signup"
                            className={style.main.secondaryLink["ROOT-STYLE"]}
                            aria-label="Sign up"
                        >
                            {style.main.secondaryLink.CONTENT}
                        </Link>
                    </div>

                    <div className={style.main.footer["ROOT-STYLE"]}>
                        By continuing you agree to our{" "}
                        <a className={style.main.link["ROOT-STYLE"]} href="/terms">
                            Terms
                        </a>{" "}
                        and{" "}
                        <a className={style.main.link["ROOT-STYLE"]} href="/privacy">
                            Privacy Policy
                        </a>
                        .
                    </div>
                </div>
            </div>
        </div>
    );
}
