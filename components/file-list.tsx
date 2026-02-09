"use client"

import * as React from "react"
import { FileText, Image as ImageIcon, FileType, X, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FileListProps {
    files: File[]
    onRemove: (index: number) => void
    onMoveUp: (index: number) => void
    onMoveDown: (index: number) => void
}

export function FileList({ files, onRemove, onMoveUp, onMoveDown }: FileListProps) {
    if (files.length === 0) {
        return null
    }

    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    const isTooLarge = totalSize > 100 * 1024 * 1024 // 100MB

    return (
        <div className="mt-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Selected Files ({files.length})</h3>
                <span className={isTooLarge ? "text-red-500 font-bold" : "text-gray-500"}>
                    Total Size: {(totalSize / (1024 * 1024)).toFixed(2)} MB / 100 MB
                </span>
            </div>

            <div className="space-y-3">
                {files.map((file, index) => {
                    let Icon = FileText
                    if (file.type.startsWith("image/")) {
                        Icon = ImageIcon
                    } else if (file.type === "text/plain") {
                        Icon = FileType
                    }

                    return (
                        <div
                            key={`${file.name}-${index}`}
                            className="group flex items-center justify-between p-4 bg-white/60 backdrop-blur-sm border border-white/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center space-x-4 overflow-hidden">
                                <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                                    <Icon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="truncate text-sm font-semibold text-gray-700">
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {(file.size / 1024).toFixed(0)} KB • {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={index === 0}
                                    onClick={() => onMoveUp(index)}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-full"
                                >
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={index === files.length - 1}
                                    onClick={() => onMoveDown(index)}
                                    className="h-8 w-8 hover:bg-gray-100 rounded-full"
                                >
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemove(index)}
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
