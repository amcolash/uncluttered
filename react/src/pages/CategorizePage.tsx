import { Button } from 'components/ui/Button';
import { useRecategorize } from 'hooks/useRecategorize';

export function CategorizePage() {
  const { emails, categories, categorize, undo, canUndo } = useRecategorize();
  const current = emails[0];

  return (
    <div className="absolute inset-0 flex bg-slate-800">
      {/* Left sidebar — category buttons */}
      <div className="flex w-64 shrink-0 flex-col gap-2 overflow-y-auto border-r border-slate-700 p-4">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-400 uppercase">Categories</h2>
        {categories
          .sort((a, b) => a.key.localeCompare(b.key))
          .map((c) => (
            <Button
              key={c.key}
              variant="secondary"
              size="sm"
              disabled={!current}
              onClick={() => categorize(current.id, c.key)}
              className="w-full justify-start text-left"
              title={c.description}
            >
              {c.key}
            </Button>
          ))}
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="flex w-full max-w-xl items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            Re-categorize <span className="text-lg font-normal text-slate-400">({emails.length} remaining)</span>
          </h1>
          <Button variant="secondary" size="sm" onClick={undo} disabled={!canUndo}>
            Undo
          </Button>
        </div>

        {current ? (
          <div className="flex w-full max-w-xl flex-col gap-4 rounded-lg border border-slate-700 bg-slate-700 p-6 shadow-lg">
            <p className="truncate font-semibold text-slate-300">{current.sender}</p>
            <p className="text-lg font-bold text-white">{current.subject}</p>
            <p className="text-sm text-slate-400">{current.snippet}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">AI:</span>
              <span className="rounded bg-slate-600 px-2 py-0.5 text-xs text-slate-200">{current.aiCategory}</span>
              {current.userOverrideCategory && (
                <>
                  <span className="text-xs text-slate-500">Override:</span>
                  <span className="rounded bg-indigo-800 px-2 py-0.5 text-xs text-slate-200">
                    {current.userOverrideCategory}
                  </span>
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-lg text-white">All done — no more emails to re-categorize!</p>
        )}
      </div>
    </div>
  );
}
