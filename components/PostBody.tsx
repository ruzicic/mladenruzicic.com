
import markdownStyles from './markdown-styles.module.css'

export default function PostBody({ content }: {content: string}) {
  return (
    <article className="max-w-2xl mx-auto">
      <div
        className={markdownStyles['markdown']}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  )
}