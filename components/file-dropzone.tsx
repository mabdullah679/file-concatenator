"use client"

import * as React from "react"
import { Upload } from "lucide-react"

interface FileDropzoneProps {
    onFilesSelected: (files: File[]) => void
}

export function FileDropzone({ onFilesSelected }: FileDropzoneProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const allowedFiles = Array.from(files).filter((file) =>
                file.type === "application/pdf" ||
                file.type === "image/png" ||
                file.type === "image/jpeg" ||
                file.type === "text/plain"
            )
            onFilesSelected(allowedFiles)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const allowedFiles = Array.from(files).filter((file) =>
                file.type === "application/pdf" ||
                file.type === "image/png" ||
                file.type === "image/jpeg" ||
                file.type === "text/plain"
            )
            onFilesSelected(allowedFiles)
        }
    }

    return (
        <div
            className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-white/50 hover:bg-white/80 hover:border-blue-400 transition-all duration-300 shadow-inner"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 transition-transform group-hover:scale-105 duration-300">
                <div className="p-4 bg-blue-50 rounded-full mb-4 group-hover:bg-blue-100 transition-colors">
                    <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <p className="mb-2 text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">PDF, PNG, JPG, TXT (Max 100MB)</p>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf,image/png,image/jpeg,text/plain"
                multiple
                onChange={handleFileChange}
            />
        </div>
    )
}
