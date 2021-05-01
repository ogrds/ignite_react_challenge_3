import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Head from 'next/head';

import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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
}

export default function Home({ postsPagination }: HomeProps) {
  const { next_page, results } = postsPagination;

  const [nextPage, setNextPage] = useState(next_page);
  const [posts, setPosts] = useState(results);

  async function handleClickLoadMore() {
    if (nextPage) {
      const response = await fetch(nextPage).then(response => response.json());
      const newPosts = [...posts];
      response.results.map(post => {
        newPosts.push({
          uid: post.uid,
          first_publication_date: format(
            new Date(post.first_publication_date),
            'dd MMM uuuu',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        });
      });
      setNextPage(response.next_page);
      setPosts(newPosts);
    }
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

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
              <span>
                <FiCalendar />{' '}
                {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <FiUser /> {post.data.author}
              </span>
            </footer>
          </div>
        ))}

        {nextPage && (
          <a onClick={handleClickLoadMore} className={styles.morePosts}>
            Carregar mais posts
          </a>
        )}
      </section>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { fetch: ['post.title', 'post.subtitle', 'post.author'], pageSize: 10 }
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
      postsPagination,
    },
  };
};
