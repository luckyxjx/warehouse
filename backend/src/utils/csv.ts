/**
 * Converts an array of flat objects into a CSV string.
 */
export function buildCsv(rows: Record<string, unknown>[], columns?: string[]): string {
  if (rows.length === 0) return "";

  const headers = columns ?? Object.keys(rows[0]);

  const escape = (value: unknown): string => {
    const str = value == null ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escape).join(",");
  const dataRows = rows.map((row) => headers.map((h) => escape(row[h])).join(","));
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Builds a multi-section CSV file separated by blank lines.
 */
export function buildMultiSectionCsv(
  sections: Array<{ title: string; rows: Record<string, unknown>[]; columns?: string[] }>
): string {
  return sections
    .map((section) => {
      const header = `### ${section.title}`;
      const csv = buildCsv(section.rows, section.columns);
      return `${header}\n${csv}`;
    })
    .join("\n\n");
}
