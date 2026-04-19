import { source } from "@/lib/source";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import type { Metadata } from "next";
import { createRelativeLink } from "fumadocs-ui/mdx";
import Link from "next/link";

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
    const params = await props.params;
    const page = source.getPage(params.slug ?? []);
    if (!page) notFound();

    const MDX = page.data.body;

    return (
        <DocsPage
            toc={page.data.toc}
            full={page.data.full}
            tableOfContent={{
                style: "clerk",
            }}
            tableOfContentPopover={{
                style: "clerk",
            }}
            footer={{
                children: (
                    <div>
                        <div className="mt-6 border-t pt-4 text-sm text-fd-muted-foreground flex flex-row">
                            <p className="my-auto">schoolm8 docs</p>
                            <div className="ml-auto flex flex-wrap items-center gap-2">
                                <Link
                                    href="/"
                                    className="inline-flex items-center rounded-md border border-fd-border bg-fd-muted/40 px-3 py-1.5 font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
                                >
                                    Home
                                </Link>
                                <a
                                    href="https://github.com/Anthony-Maxwell1/schoolm8"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center rounded-md border border-fd-border bg-fd-muted/40 px-3 py-1.5 font-medium text-fd-foreground transition-colors hover:bg-fd-muted"
                                >
                                    Github
                                </a>
                            </div>
                        </div>
                        <p className="mt-2 text-center text-xs text-fd-muted-foreground">
                            Disclaimer: Schoolm8 is not affiliated with any school or educational
                            institution. It is a third-party application developed independently to
                            help students organize their school life. Always follow your school's
                            policies and guidelines when using schoolm8, and do not share sensitive
                            information on the platform.
                        </p>
                        <p className="mt-2 text-center text-xs text-fd-muted-foreground">
                            &copy; {new Date().getFullYear()} schoolm8. All rights reserved.
                        </p>
                    </div>
                ),
            }}
        >
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDX
                    components={getMDXComponents({
                        // this allows you to link to other pages with relative file paths
                        a: createRelativeLink(source, page),
                    })}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
    const params = await props.params;
    const page = source.getPage(params.slug ?? []);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
}
