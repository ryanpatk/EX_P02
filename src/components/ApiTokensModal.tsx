import { useEffect, useRef, useState } from 'react';
import { useApiTokens } from '../hooks/useApiTokens';

interface ApiTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (value: string | null): string => {
  if (!value) return 'never';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
};

const ApiTokensModal = ({ isOpen, onClose }: ApiTokensModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [newName, setNewName] = useState('');
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const { tokens, isLoading, isCreating, createToken, revokeToken } = useApiTokens(isOpen);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFreshToken(null);
      setCopied(false);
      setNewName('');
      setConfirmingId(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    const token = await createToken(newName);
    setFreshToken(token);
    setCopied(false);
    setNewName('');
  };

  const handleCopy = async () => {
    if (!freshToken) return;
    await navigator.clipboard.writeText(freshToken);
    setCopied(true);
  };

  return (
    <dialog
      ref={dialogRef}
      className="app-modal"
      aria-labelledby="api-tokens-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onClose();
        }
      }}
    >
      <header className="app-modal-header">
        <div className="app-modal-title-wrap">
          <h2 id="api-tokens-title" className="app-modal-title">
            Access tokens
          </h2>
        </div>
        <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div className="app-modal-body">
        <p className="api-tokens-help">
          Tokens let the memex browser extension (and other clients) save links to your
          library. Each token is shown once — treat it like a password.
        </p>

        {freshToken && (
          <div className="api-tokens-fresh" role="status">
            <p className="app-field-label">New token — copy it now, it won't be shown again</p>
            <div className="api-tokens-fresh-row">
              <code className="api-tokens-value" translate="no">{freshToken}</code>
              <button
                type="button"
                className="bookmark-toolbar-cta is-secondary is-chip"
                onClick={handleCopy}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="app-field">
          <label className="app-field-label" htmlFor="api-token-name">
            Create a token
          </label>
          <div className="api-tokens-create-row">
            <input
              id="api-token-name"
              type="text"
              className="input-field"
              placeholder="Name, e.g. Chrome extension…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
            <button
              type="button"
              className="bookmark-toolbar-cta is-chip"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>

        <div className="api-tokens-list">
          {isLoading && <p className="api-tokens-help">Loading…</p>}
          {!isLoading && (tokens?.length ?? 0) === 0 && (
            <p className="api-tokens-help">No tokens yet.</p>
          )}
          {tokens?.map((token) => (
            <div key={token.id} className="api-tokens-row">
              <div className="api-tokens-row-info">
                <span className="api-tokens-row-name">{token.name}</span>
                <span className="api-tokens-row-meta">
                  created {formatDate(token.created_at)} · last used {formatDate(token.last_used_at)}
                </span>
              </div>
              <button
                type="button"
                className="bookmark-toolbar-cta is-secondary is-chip api-tokens-revoke"
                onClick={() => {
                  if (confirmingId === token.id) {
                    revokeToken(token.id);
                    setConfirmingId(null);
                  } else {
                    setConfirmingId(token.id);
                  }
                }}
                onBlur={() => setConfirmingId(null)}
              >
                {confirmingId === token.id ? 'Confirm revoke?' : 'Revoke'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
};

export default ApiTokensModal;
