import Prismic from '@prismicio/client';
import { DefaultClient } from '@prismicio/client/types/client';
import { Document } from '@prismicio/client/types/documents';

export function linkResolver(doc: Document): string {
  if (doc.type === 'post') {
    return `/post/${doc.uid}`;
  }
  return '/';
}

export function getPrismicClient(req?: unknown): DefaultClient {
  const prismic = Prismic.client(process.env.PRISMIC_API_ENDPOINT, {
    req,
    accessToken: process.env.PRISMIC_MASTER_TOKEN,
  });

  return prismic;
}
