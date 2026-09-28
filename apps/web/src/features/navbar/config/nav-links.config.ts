import { ENV_WEB_ISOMORPHIC } from "@tans/env/web/env.isomorphic";
import { m } from "@tans/i18n/messages";
import { type LinkProps } from "@tans/i18n/tanstack-start/components/link";

type NavbarLink =
  | { label: () => string; href: LinkProps["href"]; to?: never }
  | { label: () => string; href?: never; to: LinkProps["to"] };

export const navLinks: NavbarLink[] = [
  {
    label: () => m.navbar__playground(),
    to: "/playground"
  },
  {
    label: () => m.navbar__dashboard(),
    to: "/dashboard"
  },
  {
    href: `${ENV_WEB_ISOMORPHIC.VITE_SERVER_URL}/docs`,
    label: () => m.navbar__api_docs()
  }
];
