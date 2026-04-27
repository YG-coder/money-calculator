import type { Metadata } from "next";

export const SITE_NAME = "주식계산기";
export const BASE_URL = "https://주식계산기.kr";

type BuildMetadataOptions = Omit<Partial<Metadata>, "title"> & {
  slug?: string;
  title?: Metadata["title"];
};

export function buildMetadata({
  slug,
  title,
  description,
  ...rest
}: BuildMetadataOptions): Metadata {
  const canonical = slug ? `${BASE_URL}/${slug}` : BASE_URL;

  const finalDescription =
    description ??
    "주식 수익률 계산기, 평단가 계산기, 손절가 계산기, 목표가 계산기, 배당 계산기 등 투자에 필요한 계산기를 무료로 제공합니다.";

  return {
    metadataBase: new URL(BASE_URL),

    title:
      title ??
      ({
        default: `${SITE_NAME} | 무료 투자 계산기`,
        template: `%s | ${SITE_NAME}`,
      } as Metadata["title"]),

    description: finalDescription,

    openGraph: {
      title:
        typeof title === "string" ? title : `${SITE_NAME} | 무료 투자 계산기`,
      description: finalDescription,
      siteName: SITE_NAME,
      type: "website",
      locale: "ko_KR",
      url: canonical,
    },

    twitter: {
      card: "summary_large_image",
      title:
        typeof title === "string" ? title : `${SITE_NAME} | 무료 투자 계산기`,
      description: finalDescription,
    },

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical,
    },

    ...rest,
  };
}
