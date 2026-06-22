import sanitizeHtml from "sanitize-html";

export function sanitizeHtmlRecursive(data: Record<string, any>): Record<string, any> {
    const sanitizedData: Record<string, any> = {};

    for (const key in data) {
        if (typeof data[key] === "string") {
            sanitizedData[key] = sanitizeUserHtml(data[key]);
        } else if (typeof data[key] === "object" && data[key] !== null) {
            sanitizedData[key] = sanitizeHtmlRecursive(data[key]);
        } else {
            sanitizedData[key] = data[key];
        }
    }

    return sanitizedData;
}

export function sanitizeUserHtml(html: string): string {
    return sanitizeHtml(html, {
        // Only allow simple, safe formatting
        allowedTags: [
            "div",
            "span",
            "button",
            "p",
            "b",
            "i",
            "em",
            "strong",
            "ul",
            "ol",
            "li",
            "br",
            "a",
            "img",
        ],

        allowedAttributes: {
            "*": ["class"], // 👈 THIS is the big one
            a: ["href", "title"],
            img: ["src", "alt", "title"],
            button: ["type"],
        },

        // Only allow safe URL schemes
        allowedSchemes: ["http", "https"],

        // Completely disallow dangerous stuff
        disallowedTagsMode: "discard",

        // Kill all event handlers, styles, etc.
        allowedStyles: {},

        // Transform tags for extra safety
        transformTags: {
            a: (tagName, attribs) => {
                const href = attribs.href || "";

                // Only allow relative links
                if (!href.startsWith("/")) {
                    return {
                        tagName: "span",
                        text: attribs.title || href,
                        attribs: {
                            href: "",
                        },
                    };
                }

                return {
                    tagName: "a",
                    attribs: {
                        href,
                    },
                };
            },

            img: (tagName, attribs) => {
                const src = attribs.src || "";

                // Only allow relative or https images
                if (!src.startsWith("/") && !src.startsWith("https://")) {
                    return {
                        tagName: "span",
                        text: "",
                        attribs: {
                            src: "",
                            alt: "",
                        },
                    };
                }

                return {
                    tagName: "img",
                    attribs: {
                        src,
                        alt: attribs.alt || "",
                    },
                };
            },
        },

        parser: {
            lowerCaseTags: true,
        },
    });
}

export function sanitizeNameStrict(input: string): string {
    const cleaned = sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {},
    });

    return cleaned
        .replace(/[^\p{L}\p{N}\s._-]/gu, "")
        .trim()
        .slice(0, 50);
}

export const sanitise = {
    html: sanitizeUserHtml,
    recursive: sanitizeHtmlRecursive,
    nameStrict: sanitizeNameStrict,
};
