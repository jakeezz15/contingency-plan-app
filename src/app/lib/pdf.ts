export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string
) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidthMm = pdf.internal.pageSize.getWidth();
  const pageHeightMm = pdf.internal.pageSize.getHeight();
  const marginMm = 10;
  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;

  // Pixels per mm at the rendered canvas resolution.
  const pxPerMm = canvas.width / contentWidthMm;
  const pageHeightPx = Math.floor(contentHeightMm * pxPerMm);

  let renderedHeightPx = 0;
  let pageIndex = 0;

  while (renderedHeightPx < canvas.height) {
    const sliceHeightPx = Math.min(
      pageHeightPx,
      canvas.height - renderedHeightPx
    );

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const context = pageCanvas.getContext("2d");
    if (!context) break;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      renderedHeightPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    const sliceImage = pageCanvas.toDataURL("image/png");
    const sliceHeightMm = sliceHeightPx / pxPerMm;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      sliceImage,
      "PNG",
      marginMm,
      marginMm,
      contentWidthMm,
      sliceHeightMm
    );

    renderedHeightPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(fileName);
}
