import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
import { 
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Link as LinkIcon, 
  Image as ImageIcon, Heading1, Heading2, Heading3,
  Undo, Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Comece a escrever...',
  className 
}: RichTextEditorProps) {
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
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-0 py-4',
      },
    },
  })

  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('URL da imagem')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const addLink = () => {
    const url = window.prompt('URL do link')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div className={cn("overflow-hidden bg-transparent", className)}>
      {/* Toolbar */}
      <div className="px-0 py-2 flex flex-wrap items-center gap-0.5">
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título 1"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <Heading1 className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título 2"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <Heading2 className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título 3"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <Heading3 className="size-4" />
        </Toggle>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          title="Negrito"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <Bold className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          title="Itálico"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <Italic className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('underline')}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <UnderlineIcon className="size-4" />
        </Toggle>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <List className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <ListOrdered className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citação"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <Quote className="size-4" />
        </Toggle>
        
        <div className="w-px h-5 bg-border mx-1" />
        
        <Toggle
          size="sm"
          pressed={editor.isActive('link')}
          onPressedChange={addLink}
          title="Link"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <LinkIcon className="size-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={addImage}
          title="Imagem"
          className="border-0 bg-transparent hover:bg-muted"
        >
          <ImageIcon className="size-4" />
        </Toggle>
        
        <div className="flex-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <Undo className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          <Redo className="size-4" />
        </Button>
      </div>
      
      {/* Editor Content */}
      <EditorContent editor={editor} className="min-h-[400px]" />
    </div>
  )
}
