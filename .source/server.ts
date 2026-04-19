// @ts-nocheck
import * as __fd_glob_11 from "../content/docs/users/troubleshooting.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/users/settings.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/users/premium.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/users/index.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/users/getting-started.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/users/features.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/users/faq.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/users/customization.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/developers/index.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/developers/customization.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/admins/index.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/index.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {}, {"index.mdx": __fd_glob_0, "admins/index.mdx": __fd_glob_1, "developers/customization.mdx": __fd_glob_2, "developers/index.mdx": __fd_glob_3, "users/customization.mdx": __fd_glob_4, "users/faq.mdx": __fd_glob_5, "users/features.mdx": __fd_glob_6, "users/getting-started.mdx": __fd_glob_7, "users/index.mdx": __fd_glob_8, "users/premium.mdx": __fd_glob_9, "users/settings.mdx": __fd_glob_10, "users/troubleshooting.mdx": __fd_glob_11, });