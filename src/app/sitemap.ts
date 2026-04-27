import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: {
    path: string;
    priority: number;
    freq: MetadataRoute.Sitemap[0]["changeFrequency"];
  }[] = [
    { path: "", priority: 1.0, freq: "daily" },

    { path: "profit-calculator", priority: 0.9, freq: "monthly" },
    { path: "average-price-calculator", priority: 0.9, freq: "monthly" },
    { path: "target-price-calculator", priority: 0.9, freq: "monthly" },
    { path: "break-even-calculator", priority: 0.9, freq: "monthly" },
    { path: "risk-reward-calculator", priority: 0.9, freq: "monthly" },
    { path: "dividend-calculator", priority: 0.9, freq: "monthly" },
    { path: "compound-interest-calculator", priority: 0.9, freq: "monthly" },

    { path: "about", priority: 0.6, freq: "monthly" },
    { path: "contact", priority: 0.5, freq: "monthly" },
    { path: "terms", priority: 0.4, freq: "yearly" },
    { path: "privacy", priority: 0.4, freq: "yearly" },
  ];

  return staticPages.map((p) => ({
    url: p.path ? `${BASE_URL}/${p.path}` : BASE_URL,
    lastModified: new Date(),
    changeFrequency: p.freq,
    priority: p.priority,
  }));
}
