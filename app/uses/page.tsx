import { getPostBySlug } from 'lib/api'
import markdownToHtml from 'lib/markdownToHtml'
import PostBody from 'app/components/PostBody'
import DateFormatted from 'app/components/DateFormatted'

type Post = {
  title: string
  excerpt: string
  date: string
  content: string
}
export default function Uses({ post }: { post: Post }) {
  return (
    <article className="flex flex-col justify-center items-start max-w-2xl mx-auto mb-16 w-full">
      <h1 className="font-bold text-3xl md:text-5xl tracking-tight mb-4 text-black dark:text-white">
        {post.title}
      </h1>
      <div className="prose dark:prose-dark w-full">
        <p className="text-gray-700 dark:text-gray-300 mt-2 mb-8">
          {post.excerpt}
        </p>
        <p className="text-gray-700 dark:text-gray-300 mt-2 mb-8">
          <strong>Last update:</strong> <DateFormatted dateString={post.date} />
        </p>
        <PostBody content={post.content} />
      </div>
    </article>
  )
}

export async function getStaticProps() {
  const post = getPostBySlug('uses', [
    'title',
    'excerpt',
    'date',
    'slug',
    'author',
    'content',
    'ogImage',
    'coverImage',
  ])
  const content = await markdownToHtml(post.content || '')

  return {
    props: {
      post: {
        ...post,
        content,
      },
    },
  }
}
