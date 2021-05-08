import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import Link from 'next/link';
import { format } from 'date-fns';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  uid?: string;
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

interface PrevNextPosts {
  uid?: string;
  title?: string;
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevPost?: PrevNextPosts;
  nextPost?: PrevNextPosts;
}

export default function Post({
  post,
  preview,
  nextPost,
  prevPost,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }

  const readingTime = post.data.content.reduce((acc, obj) => {
    const bodyText = RichText.asText(obj.body);

    const textLength = bodyText.split(/\s/g).length;

    const time = Math.ceil(textLength / 200);

    return acc + time;
  }, 0);

  return (
    <div className={commonStyles.container}>
      <div className={commonStyles.content}>
        <Header />
      </div>
      <div id={styles.banner}>
        <img src={post.data.banner.url} alt={post.data.title} />
      </div>

      <div className={commonStyles.content}>
        <h1>{post.data.title}</h1>
        <section className={styles.info}>
          <article>
            <img src="/calendar.svg" alt="calendar" />
            <p>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </p>
          </article>

          <article>
            <img src="/user.svg" alt="user" />
            <p>{post.data.author}</p>
          </article>

          <article>
            <img src="/clock.svg" alt="clock" />
            <p>{readingTime} min</p>
          </article>
        </section>

        <p style={{ fontSize: 16, fontStyle: 'italic', marginBottom: 75 }}>
          {format(
            new Date(post.last_publication_date),
            "'* editado em' dd 'de' MMMM', às ' HH:mm",
            {
              locale: ptBR,
            }
          )}
        </p>

        <main className={styles.mainView}>
          {post.data.content.map(({ heading, body }, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className={styles.content}>
              <h1>{heading}</h1>
              <div
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: `${RichText.asHtml(body)}`,
                }}
              />
            </div>
          ))}

          <hr className={styles.postRow} />

          <div id={styles.nextPrev}>
            {prevPost !== null && (
              <span>
                <p>{prevPost.title}</p>
                <Link href={`/post/${prevPost.uid}`}>
                  <a style={{ textAlign: 'left' }}>Post Anterior</a>
                </Link>
              </span>
            )}

            {nextPost !== null && (
              <span className={styles.left}>
                <p style={{ width: '100%', textAlign: 'right' }}>
                  {nextPost.title}
                </p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a style={{ textAlign: 'right' }}>Próximo Post</a>
                </Link>
              </span>
            )}
          </div>

          <div className={styles.infoView}>
            <Comments />

            {preview && (
              <aside className={styles.viewButton}>
                <Link href="/api/exit-preview">
                  <a>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: '*',
      pageSize: 5,
    }
  );

  const uids = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: uids,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
  params,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {
    fetch: '*',
    pageSize: 5,
    ref: previewData?.ref ?? null,
  });

  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: '*',
    }
  );

  const content = response.data.content.map(({ heading, body }) => {
    return {
      heading,
      body,
    };
  });

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
      content,
    },
  };

  const { results } = posts;
  let nextPost = null;
  let prevPost = null;

  results.map((p, i) => {
    const prevIndex = i - 1;

    if (p.uid === slug) {
      if (prevIndex < 0) {
        return '';
      }
      prevPost = {
        uid: results[prevIndex]?.uid,
        title: results[prevIndex]?.data.title,
      };
    }
    return '';
  });

  results.map((p, i) => {
    const nextIndex = i + 1;
    if (p.uid === slug) {
      if (nextIndex >= results.length) {
        return '';
      }
      nextPost = {
        uid: results[nextIndex]?.uid,
        title: results[nextIndex]?.data.title,
      };
    }
    return '';
  });

  return {
    props: {
      post,
      preview,
      prevPost,
      nextPost,
    },
  };
};
