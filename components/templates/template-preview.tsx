import { Image, FileText, Video, File } from "lucide-react"

interface TemplatePreviewProps {
  headerType?: string
  headerContent?: string
  body: string
  footer?: string
  variables?: Record<string, string>
}

export function TemplatePreview({
  headerType,
  headerContent,
  body,
  footer,
  variables = {},
}: TemplatePreviewProps) {
  // Replace variables with sample values
  let displayBody = body
  Object.entries(variables).forEach(([key, value]) => {
    displayBody = displayBody.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  })
  // Replace remaining variables with placeholders
  displayBody = displayBody.replace(/\{\{(\d+)\}\}/g, "[Value $1]")

  const renderHeader = () => {
    if (!headerType) return null

    switch (headerType) {
      case "TEXT":
        return (
          <div className="font-semibold text-sm mb-2">
            {headerContent || "[Header Text]"}
          </div>
        )
      case "IMAGE":
        return (
          <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center mb-2">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        )
      case "VIDEO":
        return (
          <div className="bg-gray-200 rounded-lg h-32 flex items-center justify-center mb-2">
            <Video className="h-8 w-8 text-gray-400" />
          </div>
        )
      case "DOCUMENT":
        return (
          <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2 mb-2">
            <File className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Document</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex justify-center">
      {/* Phone mockup */}
      <div className="w-72 bg-gray-800 rounded-[2.5rem] p-2 shadow-xl">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* Phone header */}
          <div className="bg-[#075E54] text-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <FileText className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Your Business</p>
                <p className="text-xs opacity-75">Business Account</p>
              </div>
            </div>
          </div>

          {/* Chat area */}
          <div className="bg-[#ECE5DD] min-h-[300px] p-3">
            {/* Message bubble */}
            <div className="max-w-[85%] bg-white rounded-lg shadow-sm p-2">
              {renderHeader()}
              <p className="text-sm whitespace-pre-wrap">{displayBody}</p>
              {footer && (
                <p className="text-xs text-gray-500 mt-2">{footer}</p>
              )}
              <div className="flex justify-end mt-1">
                <span className="text-[10px] text-gray-400">12:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
