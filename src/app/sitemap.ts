import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/metadata";
import { blogPosts } from "@/data/blogPosts";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "",
    "about",
    "contact",
    "terms",
    "privacy-policy",
    "blog",
    "loan-interest-calculator",
    "amortization-calculator",
    "jeonse-loan-calculator",
    "prepayment-calculator",
  ];

  const staticEntries = staticPages.map((path) => ({
    url: path ? `${BASE_URL}/${path}` : BASE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const blogEntries = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
