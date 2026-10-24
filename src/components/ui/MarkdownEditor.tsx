import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorSelection, EditorState, type Range } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  type KeyBinding,
  keymap,
  placeholder as placeholderExtension,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentLess, indentMore } from '@codemirror/commands';
import { indentUnit, LanguageSupport, syntaxTree } from '@codemirror/language';
import { markdownKeymap, markdownLanguage } from '@codemirror/lang-markdown';
import type { SyntaxNodeRef } from '@lezer/common';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  autoFocus?: boolean;
}

export interface MarkdownEditorHandle {
  /** Focus the editor with the cursor at the start or end of the text. */
  focus: (at?: 'start' | 'end') => void;
}

/* ------------------------------------------------------------------ */
/* Live preview: the text stays plain markdown, but it reads rendered.  */
/* Headings, emphasis, code, links, lists and quotes are styled in      */
/* place; their syntax markers are hidden except on the lines the       */
/* cursor touches, where they show dimmed so they can be edited.        */
/* ------------------------------------------------------------------ */

class BulletWidget extends WidgetType {
  eq() {
    return true;
  }

  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-md-bullet';
    el.textContent = '•';
    el.setAttribute('aria-hidden', 'true');
    return el;
  }
}

class TaskWidget extends WidgetType {
  constructor(
    readonly checked: boolean,
    /** Position of the "[" in "[ ]" */
    readonly pos: number,
  ) {
    super();
  }

  eq(other: TaskWidget) {
    return other.checked === this.checked && other.pos === this.pos;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement('span');
    wrap.className = 'cm-md-task';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = this.checked;
    box.setAttribute('aria-label', this.checked ? 'Mark not done' : 'Mark done');
    // Toggle the source without moving the cursor onto the line
    box.addEventListener('mousedown', (event) => event.preventDefault());
    box.addEventListener('click', (event) => {
      event.preventDefault();
      view.dispatch({
        changes: { from: this.pos + 1, to: this.pos + 2, insert: this.checked ? ' ' : 'x' },
      });
    });
    wrap.appendChild(box);
    return wrap;
  }

  ignoreEvent() {
    return true;
  }
}

class RuleWidget extends WidgetType {
  eq() {
    return true;
  }

  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-md-rule';
    el.setAttribute('aria-hidden', 'true');
    return el;
  }
}

const hidden = Decoration.replace({});
const syntaxMark = Decoration.mark({ class: 'cm-md-syntax' });
const headerMark = Decoration.mark({ class: 'cm-md-syntax cm-md-hmark' });
// Fixed-width marker box (incl. its space) so text sits where bullets put it
const listMark = Decoration.mark({ class: 'cm-md-listmark' });
const bullet = Decoration.replace({ widget: new BulletWidget() });
const rule = Decoration.replace({ widget: new RuleWidget() });

const INLINE_STYLES: Record<string, string> = {
  StrongEmphasis: 'cm-md-strong',
  Emphasis: 'cm-md-em',
  Strikethrough: 'cm-md-strike',
  InlineCode: 'cm-md-code',
};

const listDepth = (node: SyntaxNodeRef) => {
  let depth = 0;
  for (let parent = node.node.parent; parent; parent = parent.parent) {
    if (parent.name === 'BulletList' || parent.name === 'OrderedList') depth += 1;
  }
  return depth;
};

const buildDecorations = (view: EditorView): DecorationSet => {
  const { state } = view;
  const decorations: Range<Decoration>[] = [];
  const doc = state.doc;

  // Lines the cursor or selection touches show their markdown
  const activeLines = new Set<number>();
  if (view.hasFocus) {
    for (const range of state.selection.ranges) {
      const first = doc.lineAt(range.from).number;
      const last = doc.lineAt(range.to).number;
      for (let line = first; line <= last; line += 1) activeLines.add(line);
    }
  }
  const isActive = (pos: number) => activeLines.has(doc.lineAt(pos).number);

  // Markers: hidden away from the cursor, dimmed on its line
  const marker = (from: number, to: number) => {
    if (to <= from) return;
    decorations.push((isActive(from) ? syntaxMark : hidden).range(from, to));
  };
  const withTrailingSpace = (to: number) => (doc.sliceString(to, to + 1) === ' ' ? to + 1 : to);

  const lineClass = (pos: number, className: string) =>
    decorations.push(Decoration.line({ class: className }).range(doc.lineAt(pos).from));

  const codeLines = new Set<number>();

  for (const { from, to } of view.visibleRanges) {
    syntaxTree(state).iterate({
      from,
      to,
      enter: (node) => {
        const { name } = node;

        const heading = /^(?:ATX|Setext)Heading(\d)$/.exec(name);
        if (heading) {
          lineClass(node.from, `cm-md-h cm-md-h${heading[1]}`);
          return;
        }

        if (name === 'HeaderMark') {
          // ATX "## " marks; Setext underlines just dim
          if (node.node.parent?.name.startsWith('ATX')) {
            const to = withTrailingSpace(node.to);
            // On the cursor's line the "##" hangs in the margin, so the
            // heading text never moves
            if (isActive(node.from)) decorations.push(headerMark.range(node.from, to));
            else decorations.push(hidden.range(node.from, to));
          } else {
            decorations.push(syntaxMark.range(node.from, node.to));
          }
          return;
        }

        const inline = INLINE_STYLES[name];
        if (inline) {
          if (node.to > node.from) {
            decorations.push(Decoration.mark({ class: inline }).range(node.from, node.to));
          }
          return;
        }

        if (name === 'EmphasisMark' || name === 'StrikethroughMark') {
          marker(node.from, node.to);
          return;
        }

        if (name === 'CodeMark') {
          if (node.node.parent?.name === 'InlineCode') marker(node.from, node.to);
          return;
        }

        if (name === 'FencedCode' || name === 'CodeBlock') {
          const first = doc.lineAt(node.from).number;
          const last = doc.lineAt(node.to).number;
          for (let line = first; line <= last; line += 1) {
            codeLines.add(line);
            const classes = ['cm-md-codeblock'];
            if (line === first) classes.push('is-first');
            if (line === last) classes.push('is-last');
            decorations.push(
              Decoration.line({ class: classes.join(' ') }).range(doc.line(line).from),
            );
          }
          // Fences and the language tag stay as quiet labels
          node.node.getChildren('CodeMark').forEach((mark) => {
            decorations.push(syntaxMark.range(mark.from, mark.to));
          });
          const info = node.node.getChild('CodeInfo');
          if (info) decorations.push(syntaxMark.range(info.from, info.to));
          return false;
        }

        if (name === 'Blockquote') {
          const first = doc.lineAt(node.from).number;
          const last = doc.lineAt(node.to).number;
          for (let line = first; line <= last; line += 1) {
            decorations.push(Decoration.line({ class: 'cm-md-quote' }).range(doc.line(line).from));
          }
          return;
        }

        if (name === 'QuoteMark') {
          marker(node.from, withTrailingSpace(node.to));
          return;
        }

        if (name === 'HorizontalRule') {
          if (!isActive(node.from)) {
            decorations.push(rule.range(node.from, node.to));
          } else {
            decorations.push(syntaxMark.range(node.from, node.to));
          }
          return;
        }

        if (name === 'ListItem') {
          // Hanging indent so wrapped lines align with the item's text
          const depth = listDepth(node);
          decorations.push(
            Decoration.line({
              class: 'cm-md-li',
              attributes: { style: `--md-depth: ${depth - 1}` },
            }).range(doc.lineAt(node.from).from),
          );
          return;
        }

        if (name === 'ListMark') {
          const item = node.node.parent;
          const list = item?.parent;
          const line = doc.lineAt(node.from);
          const active = isActive(node.from);
          // Leading indentation is carried by the hanging indent instead
          if (!active && node.from > line.from && /^\s+$/.test(doc.sliceString(line.from, node.from))) {
            decorations.push(hidden.range(line.from, node.from));
          }
          const task = item?.getChild('Task')?.getChild('TaskMarker');
          if (task) {
            if (!active) decorations.push(hidden.range(node.from, withTrailingSpace(node.to)));
            else decorations.push(syntaxMark.range(node.from, node.to));
            return;
          }
          if (list?.name === 'BulletList' && !active) {
            decorations.push(bullet.range(node.from, withTrailingSpace(node.to)));
          } else {
            decorations.push(listMark.range(node.from, withTrailingSpace(node.to)));
          }
          return;
        }

        if (name === 'TaskMarker') {
          const checked = /x/i.test(doc.sliceString(node.from, node.to));
          if (checked) {
            const line = doc.lineAt(node.from);
            const start = withTrailingSpace(node.to);
            if (line.to > start) {
              decorations.push(Decoration.mark({ class: 'cm-md-done' }).range(start, line.to));
            }
          }
          if (!isActive(node.from)) {
            decorations.push(
              Decoration.replace({ widget: new TaskWidget(checked, node.from) }).range(
                node.from,
                withTrailingSpace(node.to),
              ),
            );
          } else {
            decorations.push(syntaxMark.range(node.from, node.to));
          }
          return;
        }

        if (name === 'Link') {
          const marks = node.node.getChildren('LinkMark');
          const url = node.node.getChild('URL');
          // "[x]" / "[ ]" with no (url) is text, as in the rendered view
          // (the parser can't know it isn't a reference link)
          if (!url) return;
          const href = doc.sliceString(url.from, url.to);
          if (marks.length >= 2) {
            const textFrom = marks[0].to;
            const textTo = marks[1].from;
            if (textTo > textFrom) {
              decorations.push(
                Decoration.mark({
                  class: 'cm-md-link',
                  attributes: href ? { 'data-href': href, title: `${href} — ⌘-click to open` } : {},
                }).range(textFrom, textTo),
              );
            }
            marker(marks[0].from, marks[0].to);
            marker(marks[1].from, node.to);
          }
          return false;
        }

        if (name === 'URL' && node.node.parent?.name !== 'Image') {
          // Bare and <angle> links
          const href = doc.sliceString(node.from, node.to);
          decorations.push(
            Decoration.mark({
              class: 'cm-md-link',
              attributes: { 'data-href': href, title: `${href} — ⌘-click to open` },
            }).range(node.from, node.to),
          );
          return;
        }

        return;
      },
    });

    // Blank lines between blocks are half height, like paragraph spacing
    // in the reading view; the cursor's own blank line stays full height
    for (let pos = from; doc.length > 0 && pos <= to; ) {
      const line = doc.lineAt(pos);
      if (!line.text.trim() && !codeLines.has(line.number) && !activeLines.has(line.number)) {
        decorations.push(Decoration.line({ class: 'cm-md-blank' }).range(line.from));
      }
      pos = line.to + 1;
    }
  }

  return Decoration.set(decorations, true);
};

const livePreview = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.viewportChanged ||
        update.selectionSet ||
        update.focusChanged ||
        syntaxTree(update.startState) !== syntaxTree(update.state)
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

/* Formatting shortcuts */

const wrapWith = (mark: string) => (view: EditorView) => {
  view.dispatch(
    view.state.changeByRange((range) => ({
      changes: [
        { from: range.from, insert: mark },
        { from: range.to, insert: mark },
      ],
      range: EditorSelection.range(range.from + mark.length, range.to + mark.length),
    })),
  );
  return true;
};

const insertLink = (view: EditorView) => {
  view.dispatch(
    view.state.changeByRange((range) => {
      const label = view.state.sliceDoc(range.from, range.to) || 'link text';
      const insert = `[${label}](url)`;
      const urlFrom = range.from + label.length + 3;
      return {
        changes: { from: range.from, to: range.to, insert },
        range: EditorSelection.range(urlFrom, urlFrom + 3),
      };
    }),
  );
  return true;
};

const formattingKeymap: KeyBinding[] = [
  { key: 'Mod-b', run: wrapWith('**') },
  { key: 'Mod-i', run: wrapWith('*') },
  { key: 'Mod-k', run: insertLink },
  { key: 'Tab', run: indentMore },
  { key: 'Shift-Tab', run: indentLess },
  {
    key: 'Escape',
    run: (view) => {
      view.contentDOM.blur();
      return true;
    },
  },
];

const MarkdownEditor = forwardRef<MarkdownEditorHandle, MarkdownEditorProps>(
  ({ value, onChange, placeholder, ariaLabel, autoFocus }, ref) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    useEffect(() => {
      onChangeRef.current = onChange;
    });

    // The editor owns its text after mount; remount (key) to load another note
    const initialValue = useRef(value);

    useEffect(() => {
      const host = hostRef.current;
      if (!host) return;

      const view = new EditorView({
        parent: host,
        state: EditorState.create({
          doc: initialValue.current,
          extensions: [
            history(),
            indentUnit.of('  '),
            // The bare language, not markdown(): that pulls in lang-html for tag completion
            new LanguageSupport(markdownLanguage),
            EditorView.lineWrapping,
            livePreview,
            placeholderExtension(placeholder ?? ''),
            EditorView.contentAttributes.of({
              spellcheck: 'true',
              autocorrect: 'on',
              autocapitalize: 'sentences',
              'aria-label': ariaLabel ?? 'Note body',
              'aria-multiline': 'true',
            }),
            keymap.of([...formattingKeymap, ...markdownKeymap, ...historyKeymap, ...defaultKeymap]),
            EditorView.domEventHandlers({
              // ⌘/Ctrl-click follows a link; a plain click edits it
              mousedown: (event) => {
                if (!(event.metaKey || event.ctrlKey)) return false;
                const link = (event.target as HTMLElement).closest<HTMLElement>('[data-href]');
                const href = link?.dataset.href;
                if (!href) return false;
                event.preventDefault();
                window.open(href, '_blank', 'noopener,noreferrer');
                return true;
              },
            }),
            EditorView.updateListener.of((update) => {
              if (update.docChanged) onChangeRef.current(update.state.doc.toString());
            }),
          ],
        }),
      });
      viewRef.current = view;
      if (autoFocus) view.focus();

      return () => {
        view.destroy();
        viewRef.current = null;
      };
      // Mount once; placeholder/label are static per note
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      focus: (at = 'end') => {
        const view = viewRef.current;
        if (!view) return;
        const pos = at === 'start' ? 0 : view.state.doc.length;
        view.dispatch({ selection: { anchor: pos }, scrollIntoView: true });
        view.focus();
      },
    }));

    return <div ref={hostRef} className="memex-md-editor" />;
  },
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
