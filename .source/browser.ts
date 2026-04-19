// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "admins/index.mdx": () => import("../content/docs/admins/index.mdx?collection=docs"), "developers/customization.mdx": () => import("../content/docs/developers/customization.mdx?collection=docs"), "developers/index.mdx": () => import("../content/docs/developers/index.mdx?collection=docs"), "users/customization.mdx": () => import("../content/docs/users/customization.mdx?collection=docs"), "users/faq.mdx": () => import("../content/docs/users/faq.mdx?collection=docs"), "users/features.mdx": () => import("../content/docs/users/features.mdx?collection=docs"), "users/getting-started.mdx": () => import("../content/docs/users/getting-started.mdx?collection=docs"), "users/index.mdx": () => import("../content/docs/users/index.mdx?collection=docs"), "users/premium.mdx": () => import("../content/docs/users/premium.mdx?collection=docs"), "users/settings.mdx": () => import("../content/docs/users/settings.mdx?collection=docs"), "users/troubleshooting.mdx": () => import("../content/docs/users/troubleshooting.mdx?collection=docs"), }),
};
export default browserCollections;