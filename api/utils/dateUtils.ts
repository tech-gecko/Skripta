/**
 * Formats start and end dates into a "Month Year - Month Year" or "Month Year - Present" string.
 * @param startDateStr - The start date (string, Date, null, or undefined).
 * @param endDateStr - The end date (string, Date, null, or undefined).
 * @param endWord - The word to use if endDateStr is null/undefined (defaults to "Present").
 * @returns Formatted date range string.
 */
export const formatDateRange = (
  startDateStr: string | Date | null | undefined,
  endDateStr: string | Date | null | undefined,
  endWord: string = "Present"
): string => {
  const format = (dateStr: string | Date | null | undefined): string | null => {
    if (!dateStr) return null;
    try {
      // Use "en-US" locale for Month Year format. Change locale if needed.
      return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    } catch (e) {
      // If parsing fails, return the original string if it was a string
      return typeof dateStr === "string" ? dateStr : null;
    }
  };
  const start = format(startDateStr);
  const end = endDateStr ? format(endDateStr) : endWord; // Use endWord if no end date
  if (!start && !end) return "";
  if (!start) return end || "";
  if (!end) return start || "";
  return `${start} - ${end}`;
};
