"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { FileDropzone } from "@/components/file-dropzone"
import { FileList } from "@/components/file-list"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Trash2 } from "lucide-react"

export default function Home() {
  const [files, setFiles] = useState<File[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scalingMode, setScalingMode] = useState<'original' | 'a4' | 'letter'>('original')

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setError(null)
  }

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setFiles((prev) => {
      const newFiles = [...prev]
      const temp = newFiles[index]
      newFiles[index] = newFiles[index - 1]
      newFiles[index - 1] = temp
      return newFiles
    })
  }

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return
    setFiles((prev) => {
      const newFiles = [...prev]
      const temp = newFiles[index]
      newFiles[index] = newFiles[index + 1]
      newFiles[index + 1] = temp
      return newFiles
    })
  }

  const handleClearAll = () => {
    setFiles([])
    setError(null)
  }

  const handleMerge = async () => {
    if (files.length === 0) return

    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    if (totalSize > 100 * 1024 * 1024) {
      setError("Total file size exceeds 100MB limit.")
      return
    }

    setIsMerging(true)
    setError(null)

    try {
      const mergedPdf = await PDFDocument.create()

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()

        if (file.type === "application/pdf") {
          const pdf = await PDFDocument.load(arrayBuffer)
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

          if (scalingMode === 'original') {
            copiedPages.forEach((page) => mergedPdf.addPage(page))
          } else {
            // Standardize PDF pages to selected size
            const embeddedPages = await mergedPdf.embedPages(pdf.getPages())

            const pageSize = scalingMode === 'a4'
              ? [595.28, 841.89] as [number, number]
              : [612, 792] as [number, number]

            embeddedPages.forEach((embeddedPage) => {
              const page = mergedPdf.addPage(pageSize)
              const { width: pageWidth, height: pageHeight } = page.getSize()

              const margin = 20
              const maxWidth = pageWidth - (margin * 2)
              const maxHeight = pageHeight - (margin * 2)

              // Manual scale to fit calculation since PDFEmbeddedPage doesn't have scaleToFit
              const scaleX = maxWidth / embeddedPage.width
              const scaleY = maxHeight / embeddedPage.height
              const scale = Math.min(scaleX, scaleY, 1) // Do not scale up if smaller

              const width = embeddedPage.width * scale
              const height = embeddedPage.height * scale

              page.drawPage(embeddedPage, {
                x: (pageWidth - width) / 2,
                y: (pageHeight - height) / 2,
                width,
                height,
              })
            })
          }

        } else if (file.type === "image/jpeg" || file.type === "image/png") {
          let image
          if (file.type === "image/jpeg") {
            image = await mergedPdf.embedJpg(arrayBuffer)
          } else {
            image = await mergedPdf.embedPng(arrayBuffer)
          }

          let page
          if (scalingMode === 'original') {
            page = mergedPdf.addPage([image.width, image.height])
            page.drawImage(image, {
              x: 0,
              y: 0,
              width: image.width,
              height: image.height,
            })
          } else {
            const pageSize = scalingMode === 'a4'
              ? [595.28, 841.89] as [number, number]
              : [612, 792] as [number, number]

            page = mergedPdf.addPage(pageSize)
            const { width: pageWidth, height: pageHeight } = page.getSize()

            const margin = 20
            const maxWidth = pageWidth - (margin * 2)
            const maxHeight = pageHeight - (margin * 2)

            let dims = image.scale(1)
            if (dims.width > maxWidth || dims.height > maxHeight) {
              dims = image.scaleToFit(maxWidth, maxHeight)
            }

            page.drawImage(image, {
              x: (pageWidth - dims.width) / 2,
              y: (pageHeight - dims.height) / 2,
              width: dims.width,
              height: dims.height,
            })
          }
        } else if (file.type === "text/plain") {
          const text = await new Response(file).text()

          // Determine page size for text
          let page
          let width, height

          if (scalingMode === 'original') {
            page = mergedPdf.addPage() // Default A4 for text in original mode as text has no inherent size? Or keep A4 default.
            // Let's stick to A4 default for text files in "original" mode as they don't have dimension.
          } else {
            const pageSize = scalingMode === 'a4'
              ? [595.28, 841.89] as [number, number]
              : [612, 792] as [number, number]
            page = mergedPdf.addPage(pageSize)
          }

          ({ width, height } = page.getSize())

          const fontSize = 12
          const margin = 50

          page.drawText(text, {
            x: margin,
            y: height - margin,
            size: fontSize,
            maxWidth: width - (margin * 2),
            lineHeight: 14,
          })
        }
      }

      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = `merged_${new Date().getTime()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Error merging files:", err)
      setError("Failed to merge files. Please make sure they are valid.")
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-4xl glass-card rounded-2xl p-8 sm:p-12 mb-8">
        <div className="text-center mb-12">
          <div className="inline-block p-1 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300">
            <div className="bg-white p-3 rounded-xl">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4">
            File Concatenator
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Merge PDFs, Images, and Text files into one professional document. <br />
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mt-2 inline-block">100% Client-Side • Secure • Fast</span>
          </p>
        </div>

        <div className="flex flex-col items-center space-y-8">
          <FileDropzone onFilesSelected={handleFilesSelected} />

          {error && (
            <div className="w-full p-4 text-red-700 bg-red-50 border border-red-200 rounded-xl text-center shadow-sm animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <FileList
            files={files}
            onRemove={handleRemove}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />

          <div className="flex flex-col items-center w-full space-y-4 pt-6">
            <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/60 shadow-sm transition-all hover:bg-white/90 hover:shadow-md hover:border-blue-200">
              <span className="text-sm font-semibold text-gray-600">PDF Page Layout:</span>
              <div className="relative">
                <select
                  value={scalingMode}
                  onChange={(e) => setScalingMode(e.target.value as 'original' | 'a4' | 'letter')}
                  className="appearance-none bg-transparent text-sm font-bold text-blue-600 focus:outline-none cursor-pointer pr-8 pl-1 py-1"
                >
                  <option value="original">Original (No Scaling)</option>
                  <option value="a4">A4 (Fit Content)</option>
                  <option value="letter">Letter (Fit Content)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-600">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.586 5.757 6.343 4.343 7.757l5.657 5.657z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              {files.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={isMerging}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}

              <Button
                size="lg"
                disabled={files.length === 0 || isMerging}
                onClick={handleMerge}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[200px] shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Merge & Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
