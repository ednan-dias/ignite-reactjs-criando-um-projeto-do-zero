import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
// import PrismicDOM from 'prismic-dom';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

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

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div>
        <p>Carregando...</p>
      </div>
    );
  }

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
            <p>{post.first_publication_date}</p>
          </article>

          <article>
            <img src="/user.svg" alt="user" />
            <p>{post.data.author}</p>
          </article>

          <article>
            <img src="/clock.svg" alt="clock" />
            <p>4 min</p>
          </article>
        </section>

        {post.data.content.map(conteudo => {
          const { heading } = conteudo;

          return (
            <>
              <h1>{heading}</h1>
            </>
          );
        })}
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
      slug: post.uid,
    };
  });

  return {
    paths: [
      {
        params: {
          slug: `${uids}`,
        },
      },
    ],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const content = response.data.content.map(conteudo => {
    const { heading, body } = conteudo;
    return {
      heading,
      body: {
        text: body.map(corpo => corpo?.text)[0],
      },
    };
  });

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};
