/**
 * Adds a standard section title to the PDF document.
 * Adds more space before the title than after.
 * Automatically adds a new page if needed.
 */
export const addSectionTitle = (doc: PDFKit.PDFDocument, title: string) => {
  const FONT_BOLD = "Helvetica-Bold";
  const FONT_SIZE_SECTION_TITLE = 14;
  const SPACING_BEFORE_TITLE = 1.0; // More space before
  const SPACING_AFTER_TITLE = 0.5;  // Less space after
  const ESTIMATED_LINE_HEIGHT = FONT_SIZE_SECTION_TITLE * 1.2;

  // Add space *before* the title
  // Avoid adding double space if already at the top of a page
  if (doc.y > doc.page.margins.top + ESTIMATED_LINE_HEIGHT) { // Check if not near the top margin
    doc.moveDown(SPACING_BEFORE_TITLE);
  }

  // Check if adding the space, title, and space after might overflow
  const requiredSpace = (SPACING_BEFORE_TITLE * ESTIMATED_LINE_HEIGHT) + ESTIMATED_LINE_HEIGHT + (SPACING_AFTER_TITLE * ESTIMATED_LINE_HEIGHT);
  if (doc.y > doc.page.height - doc.page.margins.bottom - requiredSpace) {
    doc.addPage();
  }

  // Apply styling and draw title
  doc.font(FONT_BOLD)
    .fontSize(FONT_SIZE_SECTION_TITLE)
    .fillColor("black")
    .text(title, { underline: false });

  // Apply consistent spacing *after* the title
  doc.moveDown(SPACING_AFTER_TITLE);
};

/**
 * Checks if adding content of a certain height will exceed the page bottom margin.
 * If it will, adds a new page.
 * @param doc The PDFDocument instance.
 * @param contentHeight The estimated height of the content to be added.
 * @param marginBottom Optional explicit bottom margin (defaults to doc.page.margins.bottom).
 */
export const checkPageBreakBeforeDraw = (
  doc: PDFKit.PDFDocument,
  contentHeight: number,
  marginBottom?: number
): void => {
  try {
    if (!doc || !doc.page || !doc.page.margins || isNaN(doc.y) || isNaN(contentHeight)) {
      console.error("[checkPageBreak] Invalid doc state or input.");
      return;
    }
    const bottomMargin = marginBottom ?? doc.page.margins.bottom;
    const pageBottom = doc.page.height - bottomMargin;
    const buffer = 2;

    if (doc.y + contentHeight + buffer > pageBottom) {
      console.log(`[checkPageBreak] Page break condition met. Attempting doc.addPage().`); // Update log
      doc.addPage();
      console.log(`[checkPageBreak] doc.addPage() executed. New page Y: ${doc.y}`);
    }
  } catch (error) {
    console.error("[checkPageBreak] Error occurred INSIDE checkPageBreakBeforeDraw:", error);
    throw error;
  }
};
