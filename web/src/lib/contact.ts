/** Where students write when they're locked out or something's wrong. */
export const CONTACT_EMAIL = "hi@shenthar.me";
export const contactHref = (subject: string) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
