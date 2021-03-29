import { GetStaticProps } from 'next';
import Header from '../components/Header';
import { FiCalendar } from 'react-icons/fi';
import { FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR/index.js';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { RichText } from 'prismic-dom';
import { useEffect, useState } from 'react';

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
  const [posts, setPosts] = useState<Post []>(postsPagination.results)
  const [nextPage, setNextPage] = useState<string | null>(postsPagination.next_page)
  
  const handleRenderNextPage = async (): Promise<void> => {
    const response = await fetch(postsPagination.next_page)
    const data = await response.json()
    const newPosts = data.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.last_publication_date),
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
    setPosts([...posts, ...newPosts]);
    setNextPage(data.next_page);
  }

  return (
    <main className={styles.container}>
      {posts?.map(post => (
        <div key={post.uid} className={styles.posts}>
          <h1>{post.data.title}</h1>
          <p>{post.data.subtitle}</p>
          <span>
            <time>
              <FiCalendar style={{ marginRight: '5px' }} />
              {post.first_publication_date}
            </time>
            <p>
              <FiUser style={{ marginRight: '5px' }} />
              {post.data.author}
            </p>
          </span>
        </div>
      ))}

        {nextPage && (
            <a
              className={styles.loadMore}
              href="/#"
              onClick={handleRenderNextPage}
            >
              Carregar mais posts
            </a>
          )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );
  const { next_page } = postsResponse;
  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.last_publication_date),
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
        next_page,
        results: posts,
      },
      revalidate: 60 * 30, // 30 min
    },
  };
};