import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";

/** Search engines and AI assistants are welcome everywhere public. Founder pages and the API are off limits. */
const PRIVATE = ["/api/", "/desk", "/admin", "/login", "/track/", "/team", "/supplier/", "/supplier$"];
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: PRIVATE }, ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE }))],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
