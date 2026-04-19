import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Github, House, Mail } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
    return {
        links: [
            {
                type: "icon",
                url: "https://github.com/Anthony-Maxwell1/shoolm8",
                label: "GitHub",
                text: "GitHub",
                icon: <Github />,
                external: true,
                active: "none",
            },
            {
                type: "icon",
                url: "mailto:anthony@thatdev.org",
                label: "Mail",
                text: "Mail",
                icon: <Mail />,
                external: true,
                active: "none",
            },
            {
                type: "icon",
                url: "/",
                label: "Home",
                text: "Home",
                icon: <House />,
                active: "none",
            },
        ],
        nav: {
            title: "schoolm8",
            url: "/docs",
        },
    };
}
