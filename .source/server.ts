// @ts-nocheck
import * as __fd_glob_15 from "../content/docs/users/troubleshooting.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/users/settings.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/users/premium.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/users/index.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/users/getting-started.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/users/features.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/users/faq.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/users/customization.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/developers/index.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/developers/customization.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/admins/index.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/index.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/users/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/developers/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/admins/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "admins/meta.json": __fd_glob_1, "developers/meta.json": __fd_glob_2, "users/meta.json": __fd_glob_3, }, {"index.mdx": __fd_glob_4, "admins/index.mdx": __fd_glob_5, "developers/customization.mdx": __fd_glob_6, "developers/index.mdx": __fd_glob_7, "users/customization.mdx": __fd_glob_8, "users/faq.mdx": __fd_glob_9, "users/features.mdx": __fd_glob_10, "users/getting-started.mdx": __fd_glob_11, "users/index.mdx": __fd_glob_12, "users/premium.mdx": __fd_glob_13, "users/settings.mdx": __fd_glob_14, "users/troubleshooting.mdx": __fd_glob_15, });