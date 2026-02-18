import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { cn } from '@/lib/utils'

export interface EditorRef {
  toggleHeading: (level: 1 | 2 | 3) => void
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  toggleBlockquote: () => void
  addLink: () => void
  addImage: () => void
  setImage: (url: string) => void
  undo: () => void
  redo: () => void
}

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export const RichTextEditor = forwardRef<EditorRef, RichTextEditorProps>(
  function RichTextEditor({ 
    content, 
    onChange, 
    placeholder = 'Comece a escrever...',
    className 
  }, ref) {
    const prevContentRef = useRef(content)
    const [, setUpdateCounter] = useState(0)
    
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
        Image.configure({
          HTMLAttributes: {
            class: 'rounded-lg max-w-full',
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline',
          },
        }),
        Underline,
      ],
      content,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        prevContentRef.current = html
        onChange(html)
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-0 py-4 text-muted-foreground',
        },
      },
    })
    
    useImperativeHandle(ref, () => ({
      toggleHeading: (level: 1 | 2 | 3) => {
        editor?.chain().focus().toggleHeading({ level }).run()
      },
      toggleBold: () => {
        editor?.chain().focus().toggleBold().run()
      },
      toggleItalic: () => {
        editor?.chain().focus().toggleItalic().run()
      },
      toggleUnderline: () => {
        editor?.chain().focus().toggleUnderline().run()
      },
      toggleBulletList: () => {
        editor?.chain().focus().toggleBulletList().run()
      },
      toggleOrderedList: () => {
        editor?.chain().focus().toggleOrderedList().run()
      },
      toggleBlockquote: () => {
        editor?.chain().focus().toggleBlockquote().run()
      },
      addLink: () => {
        const url = window.prompt('URL do link')
        if (url && editor) {
          editor.chain().focus().setLink({ href: url }).run()
        }
      },
      addImage: () => {
        const url = window.prompt('URL da imagem')
        if (url && editor) {
          editor.chain().focus().setImage({ src: url }).run()
        }
      },
      setImage: (url: string) => {
        editor?.chain().focus().setImage({ src: url }).run()
      },
      undo: () => {
        editor?.chain().focus().undo().run()
      },
      redo: () => {
        editor?.chain().focus().redo().run()
      },
    }), [editor])
    
    useEffect(() => {
      if (editor && content !== prevContentRef.current) {
        editor.commands.setContent(content)
        prevContentRef.current = content
      }
    }, [editor, content])
    
    useEffect(() => {
      if (!editor) return
      
      const handleTransaction = () => {
        setUpdateCounter(c => c + 1)
      }
      
      editor.on('transaction', handleTransaction)
      return () => {
        editor.off('transaction', handleTransaction)
      }
    }, [editor])

    if (!editor) {
      return null
    }

    return (
      <div className={cn("overflow-hidden bg-transparent", className)}>
        <EditorContent editor={editor} className="min-h-[400px]" />
      </div>
    )
  }
)
