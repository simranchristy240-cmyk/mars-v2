import React, { useMemo, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';

import 'tinymce/tinymce';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/models/dom';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/table';
import 'tinymce/plugins/code';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/wordcount';
import 'tinymce/skins/ui/oxide/skin.min.css';

export type RichTextVariant = 'full' | 'compact' | 'inline';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** full = lesson notes; compact = questions/explanations; inline = options */
  variant?: RichTextVariant;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

const TOOLBARS: Record<RichTextVariant, string> = {
  full:
    'undo redo | blocks | bold italic underline strikethrough | forecolor backcolor | alignleft aligncenter alignright | bullist numlist | link image table | removeformat | code | wordcount',
  compact:
    'undo redo | bold italic underline | forecolor | bullist numlist | link | removeformat | code',
  inline: 'bold italic underline | bullist | removeformat',
};

const HEIGHTS: Record<RichTextVariant, number> = {
  full: 320,
  compact: 180,
  inline: 110,
};

/** Strip tags for emptiness / outline labels */
export const stripHtml = (html: string): string =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isHtmlEmpty = (html: string): boolean => !stripHtml(html);

/** Render stored HTML safely in student views */
export const HtmlContent: React.FC<{
  html?: string;
  style?: React.CSSProperties;
  className?: string;
  as?: 'div' | 'span' | 'p';
}> = ({ html, style, className, as: Tag = 'div' }) => {
  if (!html || isHtmlEmpty(html)) return null;
  return (
    <Tag
      className={className}
      style={{ lineHeight: 1.6, ...style }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  variant = 'compact',
  placeholder,
  disabled,
  id,
}) => {
  const editorRef = useRef<TinyMCEEditor | null>(null);

  const init = useMemo(
    () => ({
      height: HEIGHTS[variant],
      menubar: false as const,
      branding: false,
      statusbar: variant === 'full',
      plugins: ['lists', 'link', 'image', 'table', 'code', 'autolink', 'charmap', 'searchreplace', 'visualblocks', 'wordcount'],
      toolbar: TOOLBARS[variant],
      placeholder: placeholder || 'Write content…',
      content_style: `
        body {
          font-family: inherit;
          font-size: 14px;
          line-height: 1.55;
          color: #1a1a2e;
          padding: 8px 12px;
          margin: 0;
        }
        p { margin: 0 0 0.6em; }
        img { max-width: 100%; height: auto; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ccc; padding: 6px; }
      `,
      skin: false,
      content_css: false,
      convert_urls: false,
      promotion: false,
      resize: true,
    }),
    [variant, placeholder]
  );

  return (
    <div id={id} style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <Editor
        licenseKey="gpl"
        disabled={disabled}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
        value={value || ''}
        onEditorChange={(html) => onChange(html)}
        init={init}
      />
    </div>
  );
};
