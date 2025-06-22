// components/dashboard/chat/MarkdownFormatter.tsx
"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface MarkdownFormatterProps {
  content: string;
  isUser: boolean;
  className?: string;
}

const CodeBlock = ({ children, className, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="relative group my-2">
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 z-10 p-1.5 rounded bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? (
            <Check className="w-3 h-3 text-green-400" />
          ) : (
            <Copy className="w-3 h-3 text-gray-300" />
          )}
        </button>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="!bg-gray-900/90 !rounded-lg !text-xs !leading-relaxed !overflow-x-auto !max-w-full"
          wrapLongLines={true}
        >
          {children}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code 
      className="px-1.5 py-0.5 rounded bg-gray-800/50 text-xs font-mono border border-gray-700/50 break-words" 
      {...props}
    >
      {children}
    </code>
  );
};

const InlineCode = ({ children, ...props }: any) => (
  <code 
    className="px-1.5 py-0.5 rounded bg-gray-800/50 text-xs font-mono border border-gray-700/50 break-words whitespace-pre-wrap" 
    {...props}
  >
    {children}
  </code>
);

export function MarkdownFormatter({ content, isUser, className = "" }: MarkdownFormatterProps) {
  const components = {
    // Code blocks and inline code
    code: CodeBlock,
    inlineCode: InlineCode,
    
    // Headings with proper sizing for chat
    h1: ({ children, ...props }: any) => (
      <h1 className="text-lg font-bold mb-2 mt-1 break-words" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-base font-bold mb-2 mt-1 break-words" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-sm font-bold mb-1 mt-1 break-words" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-sm font-semibold mb-1 mt-1 break-words" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 className="text-xs font-semibold mb-1 mt-1 break-words" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 className="text-xs font-medium mb-1 mt-1 break-words" {...props}>
        {children}
      </h6>
    ),

    // Paragraphs with proper spacing
    p: ({ children, ...props }: any) => (
      <p className="mb-2 last:mb-0 break-words leading-relaxed" {...props}>
        {children}
      </p>
    ),

    // Lists with compact styling
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside mb-2 space-y-1 break-words" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside mb-2 space-y-1 break-words" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="break-words leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Emphasis and strong
    em: ({ children, ...props }: any) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="font-semibold" {...props}>
        {children}
      </strong>
    ),

    // Links with proper styling
    a: ({ children, href, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline transition-colors break-all ${
          isUser 
            ? "text-green-200 hover:text-green-100" 
            : "text-blue-400 hover:text-blue-300"
        }`}
        {...props}
      >
        {children}
      </a>
    ),

    // Blockquotes
    blockquote: ({ children, ...props }: any) => (
      <blockquote 
        className="border-l-2 border-gray-500 pl-3 my-2 italic text-gray-400 break-words"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Tables with responsive design
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto my-2">
        <table className="min-w-full text-xs border-collapse" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: any) => (
      <thead className="bg-gray-800/50" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: any) => (
      <tbody {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: any) => (
      <tr className="border-b border-gray-700/30" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-2 py-1 text-left font-medium border border-gray-700/30 break-words" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-2 py-1 border border-gray-700/30 break-words" {...props}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: ({ ...props }) => (
      <hr className="my-3 border-gray-600/50" {...props} />
    ),

    // Line breaks
    br: ({ ...props }) => <br {...props} />,
  };

  return (
    <div className={`overflow-hidden prose prose-sm max-w-none break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}