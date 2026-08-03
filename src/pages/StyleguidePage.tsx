import { useCallback, useEffect, useRef, useState } from 'react';
import BookmarkOmnibar from '../components/BookmarkOmnibar';
import CanvasColorPicker from '../components/CanvasColorPicker';
import DarkModeToggle from '../components/DarkModeToggle';
import LinkGridCard from '../components/LinkGridCard';
import LinkListRow from '../components/LinkListRow';
import NoteGridCard from '../components/NoteGridCard';
import NoteListRow from '../components/NoteListRow';
import TaskGridCard from '../components/TaskGridCard';
import TaskListRow from '../components/TaskListRow';
import type { ViewMode } from '../hooks/useViewMode';
import {
  ActionChip,
  EmptyState,
  FeedbackToast,
  FilterChip,
  FrostedStack,
  InlineCreateForm,
  MarkdownText,
  ViewToggleFab,
} from '../components/ui';
import type { FeedbackToastPhase } from '../components/ui';
import type { LinkWithTag, NoteWithTags, Tag, TaskWithTags } from '../types/database';
import { isUrlLike } from '../utils/urlInput';

const COLOR_TOKENS: { token: string; label: string }[] = [
  { token: '--bookmark-canvas-base', label: 'canvas base' },
  { token: '--bookmark-surface', label: 'surface' },
  { token: '--bookmark-surface-muted', label: 'surface muted' },
  { token: '--bookmark-text', label: 'text' },
  { token: '--bookmark-muted', label: 'text muted' },
  { token: '--bookmark-secondary-text', label: 'secondary text' },
  { token: '--bookmark-accent', label: 'accent (focus)' },
  { token: '--bookmark-active-bg', label: 'active bg' },
  { token: '--bookmark-active-fg', label: 'active fg' },
  { token: '--bookmark-prominent-bg', label: 'prominent bg' },
  { token: '--bookmark-prominent-fg', label: 'prominent fg' },
  { token: '--bookmark-border-ink', label: 'border ink' },
];

const demoTag = (id: string, name: string, color: string): Tag => ({
  id,
  user_id: 'demo',
  name,
  color,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const DEMO_TAGS = [
  demoTag('t1', 'research', '#c26a8a'),
  demoTag('t2', 'reading', '#7a8ac2'),
  demoTag('t3', 'tools', '#6aa28a'),
];

const demoLink = (
  id: string,
  url: string,
  title: string,
  tags: Tag[],
): LinkWithTag => ({
  id,
  project_id: 'demo',
  user_id: 'demo',
  url,
  title,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  order_index: 0,
  tags,
});

const DEMO_LINKS: LinkWithTag[] = [
  demoLink(
    'l1',
    'https://en.wikipedia.org/wiki/Memex',
    'Memex — Wikipedia',
    DEMO_TAGS.slice(0, 2),
  ),
  demoLink('l2', 'https://worrydream.com/refs/Bush%20-%20As%20We%20May%20Think.pdf', 'As We May Think', []),
];

const demoTask = (
  id: string,
  title: string,
  isDone: boolean,
  tags: Tag[],
  dueDate?: string,
): TaskWithTags => ({
  id,
  user_id: 'demo',
  title,
  is_done: isDone,
  due_date: dueDate,
  order_index: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  tags,
});

const DEMO_NOTE: NoteWithTags = {
  id: 'note1',
  user_id: 'demo',
  title: 'Reading notes — As We May Think',
  body: '# As We May Think\n\nBush imagines the **memex**: a desk that stores books, records, and communications — *an enlarged intimate supplement to memory*.\n\n- associative trails over indexes\n- `dry photography` for capture\n- links between items, not folders\n\n> Wholly new forms of encyclopedias will appear, ready made with a mesh of associative trails running through them.',
  order_index: 0,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-07-30T09:00:00Z',
  tags: DEMO_TAGS.slice(0, 2),
};

const TOAST_VISIBLE_MS = 3400;

const Section = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) => (
  <section className="memex-styleguide-section">
    <header className="memex-styleguide-section-header">
      <h2 className="memex-styleguide-section-title">{title}</h2>
      {note && <p className="memex-styleguide-section-note">{note}</p>}
    </header>
    <FrostedStack className="memex-styleguide-card">{children}</FrostedStack>
  </section>
);

const StyleguidePage = () => {
  const [spaceSelected, setSpaceSelected] = useState(true);
  const [tagSelected, setTagSelected] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [omnibarValue, setOmnibarValue] = useState('');
  const [toast, setToast] = useState<{ message: string; phase: FeedbackToastPhase } | null>(
    null,
  );
  const [demoViewMode, setDemoViewMode] = useState<ViewMode>('grid');
  const [demoTasks, setDemoTasks] = useState<TaskWithTags[]>([
    demoTask('task1', 'Review the styleguide page', false, DEMO_TAGS.slice(0, 2), '2026-08-14'),
    demoTask('task2', 'Ship the tasks module', false, []),
    demoTask('task3', 'Extract the omnibar', true, DEMO_TAGS.slice(2)),
  ]);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const flashToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ message: 'Applied “research” to 3 items.', phase: 'entering' });
    toastTimerRef.current = setTimeout(() => {
      setToast((current) => (current ? { ...current, phase: 'exiting' } : null));
      toastTimerRef.current = null;
      window.setTimeout(() => {
        setToast((current) => (current?.phase === 'exiting' ? null : current));
      }, 240);
    }, TOAST_VISIBLE_MS);
  }, []);

  useEffect(() => {
    document.title = 'Styleguide · memex';
    return () => {
      document.title = 'memex';
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const noop = useCallback(() => {}, []);

  return (
    <div className="memex-styleguide">
      <div className="memex-styleguide-inner">
        <header className="memex-styleguide-header">
          <div className="bookmark-toolbar-brand-shell">
            <span className="bookmark-toolbar-brand" translate="no">
              memex
            </span>
          </div>
          <p className="memex-styleguide-kicker">styleguide</p>
        </header>

        <Section
          title="Theme"
          note="Everything below re-themes live from the canvas swatch and dark mode — interactive emphasis is the user's color, never a fixed product color."
        >
          <div className="memex-styleguide-theme-row">
            <CanvasColorPicker />
            <DarkModeToggle className="bookmark-account-menu-action" />
          </div>
        </Section>

        <Section title="Color tokens" note="Core --bookmark-* roles at their current computed values.">
          <div className="memex-styleguide-swatch-grid">
            {COLOR_TOKENS.map(({ token, label }) => (
              <div key={token} className="memex-styleguide-swatch">
                <span
                  className="memex-styleguide-swatch-chip"
                  style={{ background: `var(${token})` }}
                />
                <span className="memex-styleguide-swatch-label">{label}</span>
                <code className="memex-styleguide-swatch-token">{token}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography" note="Two Weekend Go everywhere; fixed UI scale.">
          <div className="memex-styleguide-type-specimens">
            <p className="bookmark-toolbar-brand">memex — brand, 21–24px italic 500</p>
            <p className="memex-styleguide-type-heading">Heading small — 14px, 600–700</p>
            <p className="memex-styleguide-type-ui">UI text — 13px, 500 (chips, rows, omnibar)</p>
            <p className="memex-styleguide-type-caption">CAPTION — 12PX, 600 (COUNTS, KICKERS)</p>
          </div>
        </Section>

        <Section
          title="Filter chips"
          note="Idle chips are grey ink on transparent; color arrives on selection. Dashed accent border marks bulk-assign targets."
        >
          <div className="memex-styleguide-demo-row">
            <FilterChip
              variant="space"
              label="Job search"
              count={12}
              active={spaceSelected}
              onClick={() => setSpaceSelected((v) => !v)}
            />
            <FilterChip variant="space" label="Reading" count={4} onClick={noop} />
            <FilterChip variant="space" label="Bulk target" count={7} bulkTarget onClick={noop} />
            <FilterChip variant="space" label="Disabled" count={0} disabled />
          </div>
          <div className="memex-styleguide-demo-row">
            <FilterChip
              variant="tag"
              label="research"
              count={9}
              active={tagSelected}
              onClick={() => setTagSelected((v) => !v)}
            />
            <FilterChip variant="tag" label="tools" count={3} onClick={noop} />
            <FilterChip variant="tag" label="Bulk target" count={5} bulkTarget onClick={noop} />
            <FilterChip variant="tag" label="Untagged" count={2} onClick={noop} />
          </div>
        </Section>

        <Section
          title="Action chips"
          note="Fixed 6.75rem chips. Prominent fills derive from the canvas theme."
        >
          <div className="memex-styleguide-demo-row">
            <ActionChip variant="primary">Select</ActionChip>
            <ActionChip variant="secondary">Settings</ActionChip>
            <ActionChip variant="accent">Accent</ActionChip>
            <ActionChip variant="secondary" disabled>
              Disabled
            </ActionChip>
          </div>
          <div className="memex-styleguide-demo-row">
            <button type="button" className="bookmark-selection-fab">
              Select (FAB)
            </button>
            <button type="button" className="bookmark-profile-new">
              New space
            </button>
            <button type="button" className="bookmark-tag-new">
              New tag
            </button>
          </div>
        </Section>

        <Section
          title="Inline create form"
          note="Rail-footer pattern for creating spaces and tags in place."
        >
          {showCreateForm ? (
            <InlineCreateForm
              placeholder="Space name"
              onSubmit={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : (
            <button
              type="button"
              className="bookmark-profile-new"
              onClick={() => setShowCreateForm(true)}
            >
              New space
            </button>
          )}
        </Section>

        <Section
          title="Omnibar"
          note="Search + capture. Type a URL-ish value to reveal the prominent add action."
        >
          <BookmarkOmnibar
            value={omnibarValue}
            onChange={setOmnibarValue}
            showAdd={isUrlLike(omnibarValue.trim())}
            onAdd={() => setOmnibarValue('')}
            placeholder="Search 128 bookmarks…"
          />
        </Section>

        <Section
          title="List rows"
          note="Transparent rows with hairline dividers inside the frosted stack; hover uses a theme tint."
        >
          <div className="memex-styleguide-list">
            {DEMO_LINKS.map((link, index) => (
              <LinkListRow
                key={link.id}
                link={link}
                index={index}
                onOpen={noop}
                onToggleSelect={noop}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Task rows"
          note="Sibling of the link row: checkbox + title + tag pills + optional due date. Done state fills the checkbox from the theme."
        >
          <div className="memex-styleguide-list">
            {demoTasks.map((task) => (
              <TaskListRow
                key={task.id}
                task={task}
                onToggleDone={(t) =>
                  setDemoTasks((prev) =>
                    prev.map((p) => (p.id === t.id ? { ...p, is_done: !p.is_done } : p)),
                  )
                }
                onDelete={noop}
              />
            ))}
          </div>
        </Section>

        <Section
          title="Note rows"
          note="Title + plain-text excerpt + tags + relative timestamp. Click opens the editor."
        >
          <div className="memex-styleguide-list">
            <NoteListRow note={DEMO_NOTE} onOpen={noop} onDelete={noop} />
          </div>
        </Section>

        <Section
          title="Markdown"
          note="Notes are stored as markdown source; this is the rendered reading view (GFM)."
        >
          <MarkdownText>{DEMO_NOTE.body}</MarkdownText>
        </Section>

        <Section
          title="Grid view"
          note="Every module list can switch to a card grid via the corner fab (bottom-left of the app; shown inline here). The fab shows the view you would switch to. Cards share one anatomy: header / title / excerpt / tag footer."
        >
          <div className="memex-styleguide-demo-row memex-styleguide-fab-demo">
            <ViewToggleFab mode={demoViewMode} onChange={setDemoViewMode} />
          </div>
          <div className="memex-grid">
            <LinkGridCard link={DEMO_LINKS[0]} onActivate={noop} />
            <NoteGridCard note={DEMO_NOTE} onOpen={noop} />
            <TaskGridCard
              task={demoTasks[0]}
              onToggleDone={(t) =>
                setDemoTasks((prev) =>
                  prev.map((p) => (p.id === t.id ? { ...p, is_done: !p.is_done } : p)),
                )
              }
            />
          </div>
        </Section>

        <Section title="Empty state">
          <EmptyState
            title="No links match the current filters"
            subtitle="Adjust search, tags, or space to broaden the results."
          />
        </Section>

        <Section title="Feedback toast" note="Bottom-right, optimistic, non-interactive.">
          <div className="memex-styleguide-demo-row">
            <ActionChip variant="primary" onClick={flashToast}>
              Flash toast
            </ActionChip>
          </div>
        </Section>

        <Section title="Modal" note="Native <dialog> with muted header/footer.">
          <div className="memex-styleguide-demo-row">
            <ActionChip variant="secondary" onClick={() => dialogRef.current?.showModal()}>
              Open modal
            </ActionChip>
          </div>
        </Section>
      </div>

      <dialog ref={dialogRef} className="app-modal" aria-labelledby="styleguide-modal-title">
        <header className="app-modal-header">
          <div className="app-modal-title-wrap">
            <h2 id="styleguide-modal-title" className="app-modal-title">
              Modal title
            </h2>
          </div>
          <button
            type="button"
            className="app-modal-close"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>
        <div className="app-modal-body">
          <p className="app-modal-hint">
            Modal body content uses the same tokens as everything else — no separate modal
            styling vocabulary.
          </p>
        </div>
        <footer className="app-modal-footer">
          <div className="app-modal-footer-actions">
            <ActionChip variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </ActionChip>
            <ActionChip variant="primary" onClick={() => dialogRef.current?.close()}>
              Done
            </ActionChip>
          </div>
        </footer>
      </dialog>

      {toast !== null && <FeedbackToast message={toast.message} phase={toast.phase} />}
    </div>
  );
};

export default StyleguidePage;
