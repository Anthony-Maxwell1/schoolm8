import { assertAccess } from "@/lib/access/serverAccessControl";
import { auth } from "@/lib/firebaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import dompurify from "dompurify";
import { getOwnerTheme, GetTheme, updateThemeData } from "@/lib/firebaseSchema";
export function sanitizeUserHtml(html: string): string {
    return sanitizeHtml(html, {
        // Only allow simple, safe formatting
        allowedTags: ["p", "b", "i", "em", "strong", "ul", "ol", "li", "br", "span", "a", "img"],

        allowedAttributes: {
            a: ["href", "title"],
            img: ["src", "alt", "title"],
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
    const cleaned = dompurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
    });

    // Allow only reasonable characters
    const safe = cleaned
        .replace(/[^\p{L}\p{N}\s._-]/gu, "") // letters, numbers, space, . _ -
        .trim()
        .slice(0, 50); // limit length

    return safe;
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
        }

        const idToken = authHeader.split(" ")[1];
        const decodedToken = await auth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const accessResult = await assertAccess(userId, [
            "api/themes/*",
            "apiAccessLevel1",
            "UGCAccessPermitted",
        ]);

        if (accessResult.status !== 200) {
            return new Response(JSON.stringify({ error: accessResult.body!.error }), {
                status: accessResult.status,
            });
        }

        const { themeId, name, data } = await req.json();
        if ((await getOwnerTheme(themeId)) !== userId) {
            return NextResponse.json(
                { error: "Unauthorized to update this theme" },
                { status: 403 },
            );
        }
        const sanitizedData = sanitizeUserHtml(data);
        const sanitizedName = sanitizeNameStrict(name).slice(0, 20);

        const themeData = {
            ...(await GetTheme(themeId)),
            data: sanitizedData,
            name: sanitizedName,
            updated: new Date(),
        };

        await updateThemeData(themeId, themeData);

        return NextResponse.json({
            nameGotSanitized: sanitizedName != name,
            dataGotSanitized: sanitizedData != data,
            name: sanitizedName,
        });
    } catch (error) {
        console.error("Error creating theme:", error);
        return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }
}
