import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
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
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const { next_page, results } = postsPagination;

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState('');

  useEffect(() => {
    setPosts(results);
    setNextPage(next_page);
  }, [next_page, results]);

  const loadMorePosts = async (): Promise<void> => {
    const response = await fetch(next_page).then(result =>
      result.json().then(data => data)
    );

    const morePosts = response.results.map(post => {
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

    const newPosts = posts.concat(morePosts);

    setPosts(newPosts);
    setNextPage(response.next_page);
  };

  return (
    <div className={commonStyles.container}>
      <div className={commonStyles.content}>
        <Header />
        <main className={styles.mainContainer}>
          {posts.map(post => (
            <article key={post.uid}>
              <Link href={`/post/${post.uid}`}>
                <a>{post.data.title}</a>
              </Link>
              <p>{post.data.subtitle}</p>

              <div className={styles.info}>
                <time>
                  <img src="calendar.svg" alt="calendar" />
                  <p>{post.first_publication_date}</p>
                </time>

                <div>
                  <img src="user.svg" alt="user" />
                  <p>{post.data.author}</p>
                </div>
              </div>
            </article>
          ))}

          {nextPage !== null ? (
            <button type="button" onClick={loadMorePosts}>
              Carregar mais posts
            </button>
          ) : (
            ''
          )}
        </main>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: '*',
      pageSize: 5,
    }
  );

  const posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: posts,
      },
    },
  };
};
