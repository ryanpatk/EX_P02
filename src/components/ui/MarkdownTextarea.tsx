import { forwardRef, useImperativeHandle, useRef } from 'react';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}

export interface MarkdownTextareaHandle {
  /** Focus the textarea with the cursor at the end of the text. */
  focus: () => void;
}

const LIST_MARKER = /^(\s*)([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|(\d+)([.)])\s+)(.*)$/;

/**
 * Markdown-aware textarea:
 * - Enter continues list markers (-, *, +, - [ ], 1.) and exits on empty items
 * - Tab / Shift+Tab indent and outdent
 * - Cmd/Ctrl+B, I, K wrap the selection (bold, italic, link)
 */
const MarkdownTextarea = forwardRef<MarkdownTextareaHandle, MarkdownTextareaProps>(
  ({ value, onChange, onBlur, placeholder, autoFocus, ariaLabel }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        const end = el.value.length;
        el.setSelectionRange(end, end);
      },
    }));

    const applyEdit = (
      el: HTMLTextAreaElement,
      replacement: string,
      start: number,
      end: number,
      selectionStart: number,
      selectionEnd?: number,
    ) => {
      el.setRangeText(replacement, start, end, 'preserve');
      el.setSelectionRange(selectionStart, selectionEnd ?? selectionStart);
      onChange(el.value);
    };

    const wrapSelection = (el: HTMLTextAreaElement, before: string, after = before) => {
      const { selectionStart, selectionEnd } = el;
      const selected = el.value.slice(selectionStart, selectionEnd);
      applyEdit(
        el,
        `${before}${selected}${after}`,
        selectionStart,
        selectionEnd,
        selectionStart + before.length,
        selectionStart + before.length + selected.length,
      );
    };

    const insertLink = (el: HTMLTextAreaElement) => {
      const { selectionStart, selectionEnd } = el;
      const selected = el.value.slice(selectionStart, selectionEnd);
      const label = selected || 'link text';
      const replacement = `[${label}](url)`;
      const urlStart = selectionStart + label.length + 3;
      applyEdit(el, replacement, selectionStart, selectionEnd, urlStart, urlStart + 3);
    };

    const handleEnter = (el: HTMLTextAreaElement): boolean => {
      const { selectionStart, selectionEnd } = el;
      if (selectionStart !== selectionEnd) return false;

      const lineStart = el.value.lastIndexOf('\n', selectionStart - 1) + 1;
      const line = el.value.slice(lineStart, selectionStart);
      const match = LIST_MARKER.exec(line);
      if (!match) return false;

      const [, indent, marker, ordinal, ordinalDelimiter, rest] = match;

      // Empty list item → clear the marker and exit the list
      if (rest.trim() === '' && selectionStart === lineStart + line.length) {
        applyEdit(el, '', lineStart, selectionStart, lineStart);
        return true;
      }

      let nextMarker = marker;
      if (ordinal) {
        nextMarker = `${Number(ordinal) + 1}${ordinalDelimiter} `;
      } else if (/\[[ xX]\]/.test(marker)) {
        nextMarker = marker.replace(/\[[xX]\]/, '[ ]');
      }

      const insertion = `\n${indent}${nextMarker}`;
      applyEdit(
        el,
        insertion,
        selectionStart,
        selectionEnd,
        selectionStart + insertion.length,
      );
      return true;
    };

    const handleTab = (el: HTMLTextAreaElement, outdent: boolean) => {
      const { selectionStart, selectionEnd } = el;
      const lineStart = el.value.lastIndexOf('\n', selectionStart - 1) + 1;

      if (selectionStart === selectionEnd && !outdent) {
        applyEdit(el, '  ', selectionStart, selectionEnd, selectionStart + 2);
        return;
      }

      // Indent/outdent every selected line
      const blockEnd = el.value.indexOf('\n', selectionEnd);
      const end = blockEnd === -1 ? el.value.length : blockEnd;
      const block = el.value.slice(lineStart, end);
      const lines = block.split('\n');
      const nextLines = lines.map((line) =>
        outdent ? line.replace(/^ {1,2}/, '') : `  ${line}`,
      );
      const nextBlock = nextLines.join('\n');
      const delta = nextBlock.length - block.length;
      const firstLineDelta = nextLines[0].length - lines[0].length;

      applyEdit(
        el,
        nextBlock,
        lineStart,
        end,
        Math.max(lineStart, selectionStart + firstLineDelta),
        selectionEnd + delta,
      );
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = event.currentTarget;

      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        if (handleEnter(el)) {
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        handleTab(el, event.shiftKey);
        return;
      }

      if (event.metaKey || event.ctrlKey) {
        if (event.key === 'b') {
          event.preventDefault();
          wrapSelection(el, '**');
        } else if (event.key === 'i') {
          event.preventDefault();
          wrapSelection(el, '*');
        } else if (event.key === 'k') {
          event.preventDefault();
          insertLink(el);
        }
      }
    };

    return (
      <textarea
        ref={textareaRef}
        className="memex-markdown-textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoFocus={autoFocus}
        spellCheck
      />
    );
  },
);

MarkdownTextarea.displayName = 'MarkdownTextarea';

export default MarkdownTextarea;
