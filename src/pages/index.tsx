import next, { GetStaticProps } from 'next';

import { getPrismicClient } from '../services/prismic';
import * as prismic from "@prismicio/client";

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Link from 'next/link'

import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai'
import { formatDate } from '../utils/dateFormat';
import { useState } from 'react';

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

  const [page, setPage] = useState(next_page);
  const [posts, setPosts] = useState(results);

  function fetchNextPage() {
    fetch(next_page)
      .then(res => res.json())
      .then(data => {
        let newPosts: Post[];

        newPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              author: post.data.author,
              subtitle: post.data.subtitle,
            },
          }
        })

        setPage(data.next_page)
        setPosts([...posts, ...newPosts])
      })
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src="/Logo.svg" alt="logo" />
      </header>

      <main className={styles.main}>
        {posts.map((post) => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <h2>{post.data.title}</h2>
              <p>{post.data.subtitle}</p>
              <div className={styles.postInfoContainer}>
                <div className={styles.postInfo}>
                  <AiOutlineCalendar width={20} height={20} />
                  <p>{formatDate(new Date(post.first_publication_date), 'dd MMM yyyy')}</p>
                </div>
                <div className={styles.postInfo}>
                  <AiOutlineUser width={20} height={20} />
                  <p>{post.data.author}</p>
                </div>
              </div>
            </a>
          </Link>
        ))}

        {
          !!page && (
            <div style={{ marginTop: 12 }}>
              <button onClick={fetchNextPage} className={styles.button}>
                Carregar mais posts
              </button>
            </div>
          )
        }
      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const client = getPrismicClient();

  let posts: Post[];

  const response = await client.get({
    predicates: [
      prismic.predicate.at('document.type', 'posts'),
    ],
    pageSize: 1,
  });

  const nextPage = response.next_page;

  posts = response.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        author: post.data.author,
        subtitle: post.data.subtitle,
      },
    }
  })

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results: posts
      }
    }
  }
};
