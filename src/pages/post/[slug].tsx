import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Formats
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

// Prismic
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

// Styles
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className={styles.loading}>
        <img src="/spinner.svg" alt="Carregando..." />
      </div>
    );
  }

  const readingTime = post.data.content.reduce((acc, obj) => {
    const body = RichText.asText(obj.body);
    const length = body.split(/\s/g).length;
    const time = Math.ceil(length / 200);

    return acc + time;
  }, 0);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <header
        className={styles.header}
        style={{
          backgroundImage: `url('${post.data.banner.url}')`,
        }}
      ></header>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <h1>{post.data.title}</h1>
          <section>
            <span>
              <FiCalendar />
              <span>
                {format(new Date(post.first_publication_date), 'dd MMM uuuu', {
                  locale: ptBR,
                })}
              </span>
            </span>
            <span>
              <FiUser /> <span>{post.data.author}</span>
            </span>
            <span>
              <FiClock /> <span>{readingTime} min</span>
            </span>
          </section>
          <div className={styles.postContent}>
            {post.data.content.map((content, i) => {
              return (
                <article key={i + 1}>
                  {content.heading && (
                    <header className={styles.headerContent}>
                      <h3>{content.heading}</h3>
                    </header>
                  )}
                  <main
                    className={styles.textContent}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    { fetch: ['post.title'], pageSize: 2 }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths: paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  return {
    props: {
      post,
    },
  };
};
