import { GetStaticPaths, GetStaticProps } from 'next';
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlineUser } from 'react-icons/ai';
import Header from '../../components/Header';
import * as prismic from "@prismicio/client";

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { formatDate } from '../../utils/dateFormat';
import { useRouter } from 'next/router';

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
    readingTime: number;
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <div>Carregando...</div>
  }

  return (
    <>
      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt={post.data.banner.url} />

      <main className={styles.container}>
        <h1>{post.data.title}</h1>
        <div className={styles.postInfoContainer}>
          <div className={styles.postInfo}>
            <AiOutlineCalendar />
            <p>{formatDate(new Date(post.first_publication_date), 'dd MMM yyyy')}</p>
          </div>
          <div className={styles.postInfo}>
            <AiOutlineUser />
            <p>{post.data.author}</p>
          </div>
          <div className={styles.postInfo}>
            <AiOutlineClockCircle />
            <p>{post.data.readingTime} min</p>
          </div>
        </div>

        {post.data.content.map((content) => (
          <article key={content.heading} className={styles.content}>
            <h2 className={styles.contentHeading}>{content.heading}</h2>
            {content.body.map((body) => (
              <div className={styles.contentBody} key={body.text} dangerouslySetInnerHTML={{ __html: body.text }}></div>
            ))}
          </article>
        ))}
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const client = getPrismicClient();

  const response = await client.get({
    predicates: [
      prismic.predicate.at('document.type', 'posts'),
    ],
    pageSize: 100,
  });

  let paths = response.results.map(post => {
    return {
      slug: post.uid
    }
  })

  const newPaths = [];

  for (let slug of paths) {
    newPaths.push({ params: { ...slug } });
  }

  return {
    paths: newPaths,
    fallback: true
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const client = getPrismicClient();

  const { slug } = params;

  const response = await client.getByUID("posts", String(slug));

  let post: Post = null;

  let bodyWords: string = ''

  response.data.content.map((content) => {
    bodyWords += RichText.asText(content.body)
  })

  const readingTime = Math.ceil(bodyWords.split(' ').length / 200);

  post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      author: response.data.author,
      content: [{
        heading: response.data.content[0].heading,
        body: [{
          text: RichText.asHtml(response.data.content[0].body)
        }]
      }],
      banner: {
        url: response.data.banner.url
      },
      readingTime
    }
  }

  return {
    props: {
      post
    }
  }
};
