import { useState, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2 } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
  maxHeight?: number;
}

export default function PdfPreview({ url, maxHeight = 450 }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number>(520);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w - 16);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!url) return null;

  return (
    <div
      ref={containerRef}
      className="overflow-auto bg-muted/30 rounded-md"
      style={{ maxHeight }}
      data-testid="pdf-preview-container"
    >
      <Document
        file={url}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={() => setError(true)}
        loading={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">Loading PDF...</span>
          </div>
        }
        error={
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-destructive">Failed to load PDF preview.</span>
          </div>
        }
      >
        {!error && Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            width={Math.min(containerWidth, 520)}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mb-2 mx-auto"
          />
        ))}
      </Document>
    </div>
  );
}
