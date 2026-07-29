import {
  PRINT_MARGIN_MM,
  TABLOID_HEIGHT_MM,
  TABLOID_WIDTH_MM,
} from "./print";

export type PdfOrientation = "portrait" | "landscape";

/** Capture scale for sharp tabloid print (~200–300 DPI feel). */
function getHdCaptureScale() {
  if (typeof window === "undefined") return 3;
  return Math.min(4, Math.max(3, Math.ceil(window.devicePixelRatio || 2) + 1));
}

function drawCanvasOnPdfPage(
  pdf: InstanceType<typeof import("jspdf").default>,
  canvas: HTMLCanvasElement
) {
  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const marginMm = PRINT_MARGIN_MM;
  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;

  const imageRatio = canvas.width / canvas.height;
  const pageRatio = contentWidthMm / contentHeightMm;

  let drawWidthMm: number;
  let drawHeightMm: number;

  if (imageRatio > pageRatio) {
    drawWidthMm = contentWidthMm;
    drawHeightMm = contentWidthMm / imageRatio;
  } else {
    drawHeightMm = contentHeightMm;
    drawWidthMm = contentHeightMm * imageRatio;
  }

  const offsetXMm = marginMm + (contentWidthMm - drawWidthMm) / 2;
  const offsetYMm = marginMm + (contentHeightMm - drawHeightMm) / 2;
  const imageData = canvas.toDataURL("image/jpeg", 0.95);

  pdf.addImage(
    imageData,
    "JPEG",
    offsetXMm,
    offsetYMm,
    drawWidthMm,
    drawHeightMm,
    undefined,
    "MEDIUM"
  );
}

export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string,
  orientation: PdfOrientation = "portrait"
) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const pageNodes = Array.from(
    element.querySelectorAll<HTMLElement>("[data-pdf-page]")
  );
  const targets = pageNodes.length > 0 ? pageNodes : [element];

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [TABLOID_WIDTH_MM, TABLOID_HEIGHT_MM],
  });

  for (let index = 0; index < targets.length; index += 1) {
    const canvas = await html2canvas(targets[index], {
      scale: getHdCaptureScale(),
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
    });

    if (index > 0) {
      pdf.addPage([TABLOID_WIDTH_MM, TABLOID_HEIGHT_MM], orientation);
    }

    drawCanvasOnPdfPage(pdf, canvas);
  }

  pdf.save(fileName);
}
