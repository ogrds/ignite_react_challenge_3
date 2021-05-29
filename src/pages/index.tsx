import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar, FiLoader, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({ postsPagination, preview }: HomeProps) {
  const { next_page, results } = postsPagination;

  const [nextPage, setNextPage] = useState(next_page);
  const [posts, setPosts] = useState(results);
  const [isSeacrching, setIsSeacrching] = useState(false);

  async function handleClickLoadMore() {
    setIsSeacrching(true);
    if (nextPage) {
      const response = await fetch(nextPage).then(response => response.json());
      const newPosts = [...posts];
      response.results.map(post => {
        newPosts.push({
          uid: post.uid,
          first_publication_date: post.first_publication_date,
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        });
      });

      setIsSeacrching(false);
      setNextPage(response.next_page);
      setPosts(newPosts);
    }
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <Header />

      <section className={commonStyles.container}>
        {posts.map(post => (
          <div key={post.uid} className={styles.card}>
            <main className={styles.homeContainer}>
              <Link href={`/post/${post.uid}`}>
                <a>{post.data.title}</a>
              </Link>
              <span>{post.data.subtitle}</span>
            </main>
            <footer className={styles.footerContainer}>
              <main>
                <span>
                  <FiCalendar />
                </span>
                <span>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM uuuu',
                    {
                      locale: ptBR,
                    }
                  )}
                </span>
              </main>
              <main>
                <span>
                  <FiUser />
                </span>
                <span>{post.data.author}</span>
              </main>
            </footer>
          </div>
        ))}

        {nextPage && (
          <button
            onClick={handleClickLoadMore}
            className={styles.morePosts}
            disabled={isSeacrching}
          >
            {!isSeacrching ? (
              <span>Carregar mais posts</span>
            ) : (
              <FiLoader size="2rem" />
            )}
          </button>
        )}
      </section>

      {preview && (
        <aside className={commonStyles.previewMode}>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 2,
      ref: previewData?.ref ?? null,
    }
  );

  const postsValues = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsValues,
  };

  return {
    props: {
      preview,
      postsPagination,
    },
    revalidate: 30,
  };
};
