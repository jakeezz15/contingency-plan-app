import {
  PRINT_MARGIN_MM,
  TABLOID_HEIGHT_MM,
  TABLOID_WIDTH_MM,
} from "./print";
import {
  clampExportZoomRelated,
  getMapExportPixelSize,
  renderMapCanvas,
} from "./mapExport";
import type { BasemapId } from "./basemaps";
import type { MeetingPoint, Person, PlannedRoute } from "@/app/types";

export type PdfOrientation = "portrait" | "landscape";

export type MapPdfExportInput = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  routes?: PlannedRoute[];
  basemap: BasemapId;
};

/** Capture scale for sharp non-map pages (legend, etc.). */
function getHdCaptureScale() {
  if (typeof window === "undefined") return 3;
  return Math.min(4, Math.max(3, Math.ceil(window.devicePixelRatio || 2) + 1));
}

type PdfPageAlign = "top-left" | "center";

function drawCanvasOnPdfPage(
  pdf: InstanceType<typeof import("jspdf").default>,
  canvas: HTMLCanvasElement,
  align: PdfPageAlign = "center"
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

  if (align === "top-left") {
    // Prefer full page width so legend grids stay left-anchored.
    drawWidthMm = contentWidthMm;
    drawHeightMm = contentWidthMm / imageRatio;
    if (drawHeightMm > contentHeightMm) {
      drawHeightMm = contentHeightMm;
      drawWidthMm = contentHeightMm * imageRatio;
    }
  } else if (imageRatio > pageRatio) {
    drawWidthMm = contentWidthMm;
    drawHeightMm = contentWidthMm / imageRatio;
  } else {
    drawHeightMm = contentHeightMm;
    drawWidthMm = contentHeightMm * imageRatio;
  }

  const offsetXMm =
    align === "top-left"
      ? marginMm
      : marginMm + (contentWidthMm - drawWidthMm) / 2;
  const offsetYMm =
    align === "top-left"
      ? marginMm
      : marginMm + (contentHeightMm - drawHeightMm) / 2;
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
  orientation: PdfOrientation = "portrait",
  mapExport?: MapPdfExportInput
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
    const target = targets[index];
    const isMapPage = target.dataset.pdfMapExport === "true";
    let canvas: HTMLCanvasElement;

    if (isMapPage && mapExport) {
      const raw = getMapExportPixelSize(orientation);
      const pixels = clampExportZoomRelated(raw.widthPx, raw.heightPx);
      canvas = await renderMapCanvas({
        people: mapExport.people,
        meetingPoints: mapExport.meetingPoints,
        routes: mapExport.routes,
        basemap: mapExport.basemap,
        widthPx: pixels.widthPx,
        heightPx: pixels.heightPx,
      });
    } else {
      canvas = await html2canvas(target, {
        scale: getHdCaptureScale(),
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
      });
    }

    if (index > 0) {
      pdf.addPage([TABLOID_WIDTH_MM, TABLOID_HEIGHT_MM], orientation);
    }

    const align: PdfPageAlign =
      target.dataset.pdfAlign === "top" ||
      target.dataset.pdfAlign === "top-left"
        ? "top-left"
        : "center";
    drawCanvasOnPdfPage(pdf, canvas, align);
  }

  pdf.save(fileName);
}
