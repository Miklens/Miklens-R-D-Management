import React from 'react';

interface FormattedAIMessageProps {
  content: string;
}

export const FormattedAIMessage: React.FC<FormattedAIMessageProps> = ({ content }) => {
  if (!content) return null;

  // Split text by code blocks or tables if present
  const lines = content.split('\n');

  const renderedBlocks: React.ReactNode[] = [];
  let currentTableRows: string[] = [];
  let inTable = false;
  let keyIndex = 0;

  const flushTable = () => {
    if (currentTableRows.length === 0) return;

    // Parse Markdown table
    // Header row is first line, divider is second line, data rows follow
    const cleanRows = currentTableRows.filter(r => !r.trim().match(/^\|?[\s-:]+\|[\s-:]+\|?/));
    if (cleanRows.length > 0) {
      const headerRow = cleanRows[0].split('|').map(c => c.trim()).filter(Boolean);
      const dataRows = cleanRows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

      renderedBlocks.push(
        <div key={`table-${keyIndex++}`} className="my-3 overflow-x-auto rounded-2xl border border-purple-200 dark:border-purple-900/60 shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white font-bold">
                {headerRow.map((col, idx) => (
                  <th key={idx} className="p-3 border-b border-purple-800 tracking-wide font-extrabold">
                    {formatInlineText(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className={`p-3 text-gray-800 dark:text-gray-200 font-medium ${cIdx === 0 ? 'font-black text-purple-700 dark:text-purple-300' : ''}`}>
                      {formatInlineText(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    currentTableRows = [];
    inTable = false;
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Check if line is part of a markdown table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      currentTableRows.push(trimmed);
      return;
    }

    if (inTable && !trimmed.startsWith('|')) {
      flushTable();
    }

    // Headers (### or ## or #)
    if (trimmed.startsWith('#')) {
      const level = (trimmed.match(/^#+/) || ['#'])[0].length;
      const text = trimmed.replace(/^#+\s*/, '');
      renderedBlocks.push(
        <h4 key={`h-${idx}`} className="font-extrabold text-sm md:text-base text-purple-900 dark:text-purple-300 mt-3 mb-1.5 flex items-center gap-2 border-b border-purple-100 dark:border-purple-900/40 pb-1">
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
          {formatInlineText(text)}
        </h4>
      );
      return;
    }

    // Bullet points (• or - or *)
    if (trimmed.match(/^([•\-\*]|\d+\.)\s+/)) {
      const text = trimmed.replace(/^([•\-\*]|\d+\.)\s+/, '');
      renderedBlocks.push(
        <div key={`li-${idx}`} className="flex items-start gap-2.5 my-1 pl-1 text-gray-700 dark:text-gray-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
          <div className="flex-1 leading-relaxed">
            {formatInlineText(text)}
          </div>
        </div>
      );
      return;
    }

    // Empty space
    if (!trimmed) {
      renderedBlocks.push(<div key={`sp-${idx}`} className="h-2" />);
      return;
    }

    // Regular Paragraph
    renderedBlocks.push(
      <p key={`p-${idx}`} className="leading-relaxed text-gray-800 dark:text-gray-200 my-1 font-normal">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  if (inTable) {
    flushTable();
  }

  return <div className="space-y-1">{renderedBlocks}</div>;
};

// Helper function to render bold, code, and highlight inline tags nicely
function formatInlineText(text: string): React.ReactNode {
  if (!text) return null;

  // Split by bold (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-gray-900 dark:text-white bg-purple-50 dark:bg-purple-950/40 px-1 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="font-mono text-[11px] bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
