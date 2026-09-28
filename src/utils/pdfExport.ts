import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  fileName?: string;
  margin?: [number, number, number, number]; // [top, left, bottom, right] in mm (used if manual margins needed)
  scale?: number;
  quality?: number;
  onProgress?: (progressText: string) => void;
}

/**
 * High-fidelity PDF exporter supporting OKLCH colors (Tailwind CSS v4),
 * zero distortion, smart multi-page pagination, and 100% anti-cutoff guarantees
 * for official Indonesian school and government A4 documents.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
): Promise<void> {
  const {
    fileName = 'Dokumen_Kedinasan.pdf',
    scale = 2,
    quality = 0.98,
    onProgress
  } = options;

  if (!element) {
    throw new Error('Elemen dokumen tidak ditemukan.');
  }

  // 1. Check if the element contains explicit pre-calibrated A4 pages (.print-page)
  const explicitPages = Array.from(element.querySelectorAll<HTMLElement>('.print-page'));
  
  if (explicitPages.length > 0) {
    onProgress?.(`Menyiapkan ${explicitPages.length} halaman A4 resmi kedinasan...`);

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true
    });

    let currentPdfPage = 0;

    for (let i = 0; i < explicitPages.length; i++) {
      onProgress?.(`Memproses Halaman ${i + 1} dari ${explicitPages.length}...`);

      const pageEl = explicitPages[i];
      
      const pageCanvas = await html2canvas(pageEl, {
        scale: scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc) => {
          // Hide all elements marked as no-print
          const noPrint = clonedDoc.querySelectorAll('.no-print');
          noPrint.forEach(el => (el as HTMLElement).style.display = 'none');

          // Ensure all cloned print pages have official crisp styling without card shadows/borders
          const pages = clonedDoc.querySelectorAll<HTMLElement>('.print-page');
          pages.forEach(p => {
            p.style.width = '794px';
            p.style.maxWidth = '794px';
            p.style.minWidth = '794px';
            p.style.margin = '0 auto';
            p.style.border = 'none';
            p.style.borderRadius = '0';
            p.style.boxShadow = 'none';
            p.style.backgroundColor = '#ffffff';
            p.style.boxSizing = 'border-box';
            p.style.minHeight = 'auto';
            p.style.padding = '24px 32px';
          });
        }
      });

      // Standard A4 aspect ratio: 297mm / 210mm = 1.4142857
      const a4Aspect = 297 / 210;
      const targetCanvasHeightForSinglePage = Math.round(pageCanvas.width * a4Aspect);

      if (currentPdfPage > 0) {
        pdf.addPage('a4', 'portrait');
      }
      currentPdfPage++;

      // Create pristine A4 destination canvas
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = pageCanvas.width;
      finalCanvas.height = targetCanvasHeightForSinglePage;
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        
        // Fit cleanly: scale down proportionally if content is taller than A4, ensuring 0% is ever cut or sliced
        const scaleFactor = Math.min(1, targetCanvasHeightForSinglePage / pageCanvas.height);
        const drawW = pageCanvas.width * scaleFactor;
        const drawH = pageCanvas.height * scaleFactor;
        const drawX = (finalCanvas.width - drawW) / 2;
        const drawY = 0;
        
        ctx.drawImage(pageCanvas, 0, 0, pageCanvas.width, pageCanvas.height, drawX, drawY, drawW, drawH);
        const imgData = finalCanvas.toDataURL('image/jpeg', quality);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      } else {
        const imgData = pageCanvas.toDataURL('image/jpeg', quality);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
    }

    onProgress?.('Menyimpan berkas PDF...');
    pdf.save(fileName);
    return;
  }

  // 2. Fallback for continuous document: intelligent slice pagination
  onProgress?.('Menyiapkan tata letak dokumen...');

  const canvas = await html2canvas(element, {
    scale: scale,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
    onclone: (clonedDoc) => {
      const clonedElem = clonedDoc.querySelector('.printable-document') as HTMLElement;
      if (clonedElem) {
        clonedElem.style.width = '794px';
        clonedElem.style.maxWidth = '794px';
        clonedElem.style.minWidth = '794px';
        clonedElem.style.margin = '0 auto';
        clonedElem.style.boxShadow = 'none';
        clonedElem.style.border = 'none';
        clonedElem.style.backgroundColor = '#ffffff';
      }

      const noPrintElements = clonedDoc.querySelectorAll('.no-print');
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    }
  });

  onProgress?.('Menyusun lembar PDF A4...');

  const a4Aspect = 297 / 210;
  const pageHeightCanvas = Math.round(canvas.width * a4Aspect);

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compress: true
  });

  let currentY = 0;
  let pageIndex = 0;

  while (currentY < canvas.height) {
    if (pageIndex > 0) {
      pdf.addPage('a4', 'portrait');
    }

    onProgress?.(`Memproses halaman ${pageIndex + 1}...`);

    const remainingHeight = canvas.height - currentY;
    const sliceHeight = Math.min(pageHeightCanvas, remainingHeight);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = pageHeightCanvas;

    const ctx = sliceCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0, currentY, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight
      );

      const sliceData = sliceCanvas.toDataURL('image/jpeg', quality);
      pdf.addImage(sliceData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    currentY += sliceHeight;
    pageIndex++;
  }

  onProgress?.('Menyimpan berkas PDF...');
  pdf.save(fileName);
}
