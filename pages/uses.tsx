import UsesLayout from 'layouts/Uses'
import { getPostBySlug } from 'lib/api'
import markdownToHtml from 'lib/markdownToHtml'
import PostBody from 'components/PostBody'

type Post = {
  title: string
  excerpt: string
  date: string
  content: string
}
export default function Uses({ post }: { post: Post }) {
  return (
    <UsesLayout>
      <PostBody content={post.content} />
    </UsesLayout>
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
