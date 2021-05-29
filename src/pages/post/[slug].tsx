import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Components
import Header from '../../components/Header';

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
import { Comments } from '../../components/Comments';
import Link from 'next/link';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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

interface NewPost {
  link: string;
  title: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  next: NewPost;
  previous: NewPost;
}

export default function Post({ post, preview, previous, next }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Header />
        <div className={styles.loading}>
          <img src="/spinner.svg" alt="Carregando..." />
        </div>
      </>
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

      <Header />

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
          <section>
            {post.last_publication_date && (
              <span>
                {format(
                  new Date(post.last_publication_date),
                  "'* editado em 'dd MMM uuuu 'as' kk':'mm",
                  {
                    locale: ptBR,
                  }
                )}
              </span>
            )}
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

      <footer className={styles.footer}>
        {previous.title ? (
          <div className={styles.previous}>
            <span title={previous.title}>{previous.title}</span>
            <a href={`/post/${previous.link}`}>Post anterior</a>
          </div>
        ) : (
          <div></div>
        )}

        {next.title ? (
          <div className={styles.next}>
            <span title={next.title}>{next.title}</span>
            <a href={`/post/${next.link}`}>Próximo post</a>
          </div>
        ) : (
          <div></div>
        )}
      </footer>

      <Comments />

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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const prevpost = (
    await prismic.query([Prismic.predicates.at('document.type', 'post')], {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    })
  ).results[0];

  const nextpost = (
    await prismic.query([Prismic.predicates.at('document.type', 'post')], {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    })
  ).results[0];

  const previous = {
    link: prevpost?.uid || null,
    title: prevpost?.data.title || null,
  };

  const next = {
    link: nextpost?.uid || null,
    title: nextpost?.data.title || null,
  };

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
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
      preview,
      post,
      next,
      previous,
    },
    revalidate: 30,
  };
};
