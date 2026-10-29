import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useContentProtection } from '../../hooks/useContentProtection';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import '../../styles/components/pdf-viewer.css';

// Initialize PDF.js worker
if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNum: number;
  scale: number;
  watermarkText: string;
  onVisible?: (pageNum: number) => void;
}

const PdfPageCanvas: React.FC<PdfPageCanvasProps> = React.memo(({
  pdfDoc,
  pageNum,
  scale,
  watermarkText,
  onVisible,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Read initial page viewport dimensions
  useEffect(() => {
    let active = true;
    pdfDoc.getPage(pageNum).then((page: any) => {
      if (!active) return;
      const vp = page.getViewport({ scale: Math.max(0.3, scale) });
      setDimensions({ width: Math.floor(vp.width), height: Math.floor(vp.height) });
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [pdfDoc, pageNum, scale]);

  // Track visibility for lazy rendering and page counter
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          onVisible?.(pageNum);
        }
      },
      { rootMargin: '400px 0px 400px 0px', threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, onVisible]);

  // Render page to canvas
  useEffect(() => {
    if (!isVisible || !pdfDoc || !canvasRef.current || scale <= 0) return;

    let cancelled = false;
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (e) {}
    }

    pdfDoc.getPage(pageNum).then((page: any) => {
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: Math.max(0.3, scale) });
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      const renderTask = page.render({
        canvasContext: context,
        viewport,
      });
      renderTaskRef.current = renderTask;

      renderTask.promise.catch((err: any) => {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      });
    });

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {}
      }
    };
  }, [isVisible, pdfDoc, pageNum, scale]);

  return (
    <div
      ref={containerRef}
      className="pdf-page-item"
      data-page-number={pageNum}
      style={{
        width: dimensions ? `${dimensions.width}px` : '100%',
        minHeight: dimensions ? `${dimensions.height}px` : '300px',
      }}
    >
      <div className="pdf-canvas-wrapper">
        <canvas ref={canvasRef} className="pdf-canvas" />

        {/* Dynamic Anti-Leak Watermark Overlay */}
        <div className="pdf-watermark-layer" aria-hidden="true">
          <div className="pdf-watermark-row">
            <span>{watermarkText}</span>
            <span>{watermarkText}</span>
          </div>
          <div className="pdf-watermark-row">
            <span>{watermarkText}</span>
            <span>{watermarkText}</span>
          </div>
          <div className="pdf-watermark-row">
            <span>{watermarkText}</span>
            <span>{watermarkText}</span>
          </div>
        </div>
      </div>
      <div className="pdf-page-number-tag">Page {pageNum}</div>
    </div>
  );
});

interface PdfNotesViewerProps {
  lessonId: string;
  notesTitle?: string;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  matchedHeight?: number;
}

export const PdfNotesViewer: React.FC<PdfNotesViewerProps> = ({
  lessonId,
  isMaximized = false,
  onToggleMaximize,
  matchedHeight,
}) => {
  const { user } = useAuth();
  useContentProtection(true);

  const viewportContainerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [visiblePage, setVisiblePage] = useState<number>(1);
  const [fitScale, setFitScale] = useState<number>(1.0);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF data via authenticated API endpoint
  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/lessons/lessons/${lessonId}/notes`, {
        responseType: 'arraybuffer',
      });

      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(response.data),
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
        cMapPacked: true,
      });

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setVisiblePage(1);
    } catch (err: any) {
      console.error('Failed to load PDF notes:', err);
      const msg = err.response?.data?.error || 'Unable to load notes for this lesson.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Compute fit-to-width scale based on current container width
  const computeFitScale = useCallback(async () => {
    if (!pdfDoc || !viewportContainerRef.current) return;
    try {
      const page = await pdfDoc.getPage(1);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      // Leave 28px margin/padding
      const availableWidth = viewportContainerRef.current.clientWidth - 28;
      if (availableWidth > 80 && unscaledViewport.width > 0) {
        const computed = availableWidth / unscaledViewport.width;
        setFitScale(computed);
      }
    } catch (e) {
      /* ignore */
    }
  }, [pdfDoc]);

  useEffect(() => {
    computeFitScale();
  }, [computeFitScale]);

  // Observe container resize to auto-adjust fit scale
  useEffect(() => {
    const el = viewportContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      computeFitScale();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [computeFitScale]);

  const effectiveZoom = fitScale * zoomMultiplier;

  const handleZoomIn = () => setZoomMultiplier((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoomMultiplier((prev) => Math.max(prev - 0.15, 0.5));
  const handleResetZoom = () => setZoomMultiplier(1.0);

  // Watermark text identity
  const watermarkText = `${user?.name || 'MARS Student'} • ${user?.email || 'Confidential'} • ID:${user?._id?.toString().slice(-6) || 'MARS'}`;

  const containerStyle: React.CSSProperties = {
    height: matchedHeight ? `${matchedHeight}px` : undefined,
    maxHeight: matchedHeight ? `${matchedHeight}px` : undefined,
  };

  return (
    <div
      className="pdf-viewer-container"
      style={containerStyle}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Main Viewport: Continuous Multi-Page Scrollable List */}
      <div className="pdf-viewer-viewport" ref={viewportContainerRef}>
        {loading && (
          <div className="pdf-state-box">
            <div className="pdf-spinner" />
            <p style={{ fontSize: '0.85rem' }}>Loading study notes…</p>
          </div>
        )}

        {error && (
          <div className="pdf-state-box">
            <AlertCircle size={32} style={{ color: 'var(--error, #e53e3e)' }} />
            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{error}</p>
          </div>
        )}

        {!loading && !error && pdfDoc && numPages > 0 && (
          Array.from({ length: numPages }, (_, i) => i + 1).map((pNum) => (
            <PdfPageCanvas
              key={pNum}
              pdfDoc={pdfDoc}
              pageNum={pNum}
              scale={effectiveZoom}
              watermarkText={watermarkText}
              onVisible={setVisiblePage}
            />
          ))
        )}
      </div>

      {/* Viewer Bottom Bar (Moved down to align with video bottom bar) */}
      <div className="pdf-viewer-bottom-bar">
        <div className="pdf-header-left">
          <span className="pdf-page-status-pill">
            {numPages > 0 ? `Page ${visiblePage} / ${numPages}` : 'Loading…'}
          </span>
        </div>

        <div className="pdf-viewer-controls">
          {/* Zoom Group */}
          <div className="pdf-control-group">
            <button
              type="button"
              className="pdf-ctrl-btn"
              onClick={handleZoomOut}
              disabled={zoomMultiplier <= 0.5}
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <button
              type="button"
              className="pdf-ctrl-btn"
              onClick={handleResetZoom}
              title="Fit to width (reset)"
              aria-label="Fit to width (reset)"
            >
              <RotateCcw size={12} />
            </button>
            <button
              type="button"
              className="pdf-ctrl-btn"
              onClick={handleZoomIn}
              disabled={zoomMultiplier >= 2.5}
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Maximize Toggle */}
          {onToggleMaximize && (
            <button
              type="button"
              className="pdf-ctrl-btn"
              style={{
                background: 'var(--tile-muted, #f7f4ee)',
                border: '1px solid var(--border-color, rgba(9, 9, 65, 0.08))',
              }}
              onClick={onToggleMaximize}
              title={isMaximized ? 'Restore split view' : 'Maximize notes'}
              aria-label={isMaximized ? 'Restore split view' : 'Maximize notes'}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
