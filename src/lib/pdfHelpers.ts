import type { ProcessingProgress, TableOfContentsItem } from '@/types/publication'
import pdfWorkerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

type PdfjsModule = typeof import('pdfjs-dist/legacy/build/pdf.mjs')

let pdfjsPromise: Promise<PdfjsModule> | null = null
let workerConfigured = false

const getPdfjs = async (): Promise<PdfjsModule> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing requires a browser environment.')
  }

  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs')
  }

  const pdfjs = await pdfjsPromise
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc
    workerConfigured = true
  }

  return pdfjs
}

export type PdfProcessingCallbacks = {
  onProgress: (progress: ProcessingProgress) => void
}

export type RenderedPage = {
  pageNumber: number
  imageDataUrl: string
  thumbnailDataUrl: string
  width: number
  height: number
}

export async function extractPdfOutline(
  pdfUrl: string,
): Promise<TableOfContentsItem[]> {
  try {
    const pdfjs = await getPdfjs()
    const pdf = await pdfjs.getDocument(pdfUrl).promise
    const outline = await pdf.getOutline()

    if (!outline) return []

    const items: TableOfContentsItem[] = []

    const processItems = async (outlineItems: any[], level: number): Promise<void> => {
      for (const item of outlineItems) {
        let pageNumber = 1

        try {
          if (item.dest) {
            if (typeof item.dest === 'string') {
              const dest = await pdf.getDestination(item.dest)
              if (dest && dest[0]) {
                pageNumber = (await pdf.getPageIndex(dest[0])) + 1
              }
            } else if (Array.isArray(item.dest) && item.dest[0]) {
              pageNumber = (await pdf.getPageIndex(item.dest[0])) + 1
            }
          }
        } catch {
          pageNumber = 1
        }

        items.push({
          title: item.title,
          pageNumber,
          level,
        })

        if (item.items?.length) {
          await processItems(item.items, level + 1)
        }
      }
    }

    await processItems(outline, 0)
    return items
  } catch {
    return []
  }
}

export async function* renderAllPages(
  pdfUrl: string,
  callbacks: PdfProcessingCallbacks,
): AsyncGenerator<RenderedPage> {
  const pdfjs = await getPdfjs()
  const pdf = await pdfjs.getDocument(pdfUrl).promise
  const totalPages = pdf.numPages

  callbacks.onProgress({
    status: 'rendering',
    currentPage: 0,
    totalPages,
  })

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    callbacks.onProgress({
      status: 'rendering',
      currentPage: pageNum,
      totalPages,
    })

    const page = await pdf.getPage(pageNum)

    const fullViewport = page.getViewport({ scale: 2 })
    const fullCanvas = document.createElement('canvas')
    const fullCtx = fullCanvas.getContext('2d')!
    fullCanvas.width = fullViewport.width
    fullCanvas.height = fullViewport.height

    await (page.render({
      canvasContext: fullCtx,
      viewport: fullViewport,
    } as any)).promise

    const imageDataUrl = fullCanvas.toDataURL('image/webp', 0.85)

    const thumbScale = 150 / page.getViewport({ scale: 1 }).width
    const thumbViewport = page.getViewport({ scale: thumbScale })
    const thumbCanvas = document.createElement('canvas')
    const thumbCtx = thumbCanvas.getContext('2d')!
    thumbCanvas.width = thumbViewport.width
    thumbCanvas.height = thumbViewport.height

    await (page.render({
      canvasContext: thumbCtx,
      viewport: thumbViewport,
    } as any)).promise

    const thumbnailDataUrl = thumbCanvas.toDataURL('image/webp', 0.7)

    yield {
      pageNumber: pageNum,
      imageDataUrl,
      thumbnailDataUrl,
      width: fullCanvas.width,
      height: fullCanvas.height,
    }
  }

  callbacks.onProgress({
    status: 'completed',
    currentPage: totalPages,
    totalPages,
  })
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',')
  const mimeMatch = header.match(/:(.*?);/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/webp'
  const binary = atob(data)
  const array = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }

  return new Blob([array], { type: mime })
}
