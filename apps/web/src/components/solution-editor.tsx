import { useMemo } from 'react'
import { HdSelect } from '@/components/ui/hd-select'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView, highlightActiveLine } from '@codemirror/view'
import type { SubmitFlowLanguage } from '@/utils/editor-language'
import { languageToHighlightId, SUBMIT_FLOW_LANGUAGES } from '@/utils/editor-language'

const highlightById = {
  ts: javascript({ typescript: true }),
  js: javascript(),
  py: python(),
  rs: rust(),
} as const

const LANGUAGE_OPTIONS = SUBMIT_FLOW_LANGUAGES.map((value) => ({
  value,
  label:
    value === 'TS'
      ? 'TypeScript'
      : value === 'JS'
        ? 'JavaScript'
        : value === 'PYTHON'
          ? 'Python'
          : 'Rust',
}))

export type TestCaseResult = {
  id: string
  name: string
  passed: boolean
  detail?: string | null
}

const hdEditorChrome = EditorView.theme(
  {
    '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
    '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.03)' },
    '.cm-content': {
      backgroundImage: `repeating-linear-gradient(
        to right,
        transparent 0,
        transparent calc(2ch - 0.5px),
        rgba(255,255,255,0.05) calc(2ch - 0.5px),
        rgba(255,255,255,0.05) 2ch
      )`,
    },
  },
  { dark: true },
)

type SolutionEditorProps = {
  value: string
  onChange: (v: string) => void
  language: SubmitFlowLanguage
  onLanguageChange: (l: SubmitFlowLanguage) => void
  onRunTests: () => void
  testResults: TestCaseResult[] | null
  executionTimeMs: number | null
  runDisabled: boolean
  runPending?: boolean
}

export function SolutionEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  onRunTests,
  testResults,
  executionTimeMs,
  runDisabled,
  runPending = false,
}: SolutionEditorProps) {
  const hid = languageToHighlightId(language)

  const extensions = useMemo(() => {
    return [oneDark, highlightById[hid], highlightActiveLine(), hdEditorChrome]
  }, [hid])

  const runBlocked = runDisabled || runPending

  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-[12px] border border-hd-border bg-hd-card">
      <div className="flex items-center justify-end border-b border-hd-border px-2 py-2">
        <div className="ml-auto w-full max-w-[13rem]">
          <HdSelect
            aria-label="Language"
            size="sm"
            value={language}
            onChange={(v) => onLanguageChange(v as SubmitFlowLanguage)}
            options={LANGUAGE_OPTIONS}
            buttonClassName="bg-hd-card"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          value={value}
          height="100%"
          minHeight="280px"
          theme="none"
          extensions={extensions}
          onChange={onChange}
          basicSetup={{ lineNumbers: true, foldGutter: false }}
          className="text-[13px] [&_.cm-editor]:min-h-[280px] [&_.cm-editor]:outline-none [&_.cm-scroller]:font-mono"
        />
      </div>
      <div className="border-t border-hd-border p-3">
        <button
          type="button"
          onClick={onRunTests}
          disabled={runBlocked}
          className="flex h-[38px] w-full items-center justify-center gap-2 rounded-full border border-hd-indigo/50 bg-transparent text-sm font-medium text-hd-indigo-tint transition-colors duration-150 ease-out hover:border-hd-indigo hover:bg-hd-indigo-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
          {runPending ? 'Running…' : 'Run tests'}
        </button>
        <div className="mt-3 min-h-[88px] rounded-lg border border-hd-border bg-hd-surface px-3 py-2">
          {runPending && testResults == null && (
            <p className="animate-pulse text-xs text-hd-muted">Running tests against Judge0…</p>
          )}
          {!runPending && testResults == null && (
            <p className="text-xs text-hd-muted">Run tests to see pass/fail per case.</p>
          )}
          {testResults != null && testResults.length === 0 && (
            <p className="text-xs text-hd-muted">No test cases returned.</p>
          )}
          {testResults != null && testResults.length > 0 && (
            <ul className="space-y-2">
              {testResults.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-1 font-mono text-[11px] text-hd-secondary"
                >
                  <div className="flex items-start gap-2">
                    {t.passed ? (
                      <span className="mt-0.5 text-hd-emerald" aria-hidden>
                        ✓
                      </span>
                    ) : (
                      <span className="mt-0.5 text-hd-rose" aria-hidden>
                        ✕
                      </span>
                    )}
                    <span className="min-w-0 flex-1">{t.name}</span>
                    <span
                      className={t.passed ? 'shrink-0 text-hd-emerald' : 'shrink-0 text-hd-rose'}
                    >
                      {t.passed ? 'passed' : 'failed'}
                    </span>
                  </div>
                  {!t.passed && t.detail?.trim() ? (
                    <pre className="max-h-24 overflow-auto whitespace-pre-wrap break-words rounded border border-hd-border/80 bg-hd-card/80 px-2 py-1.5 text-[10px] text-hd-rose/90">
                      {t.detail.trim()}
                    </pre>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {testResults != null && testResults.length > 0 && (
            <div className="mt-2 flex items-end justify-between border-t border-hd-border pt-2">
              {testResults.every((t) => t.passed) ? (
                <p
                  className="font-mono text-[11px] text-hd-emerald"
                  data-testid="solution-all-tests-passed"
                >
                  All tests passed
                </p>
              ) : (
                <span />
              )}
              {executionTimeMs != null && (
                <span className="font-mono text-[10px] text-hd-muted">{executionTimeMs} ms</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
