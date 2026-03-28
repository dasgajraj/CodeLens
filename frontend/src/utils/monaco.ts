import type { editor } from 'monaco-editor'

export function configureMonaco(monaco: typeof import('monaco-editor')) {
  monaco.editor.defineTheme('codelens-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '7dd3fc' },
      { token: 'type.identifier', foreground: 'f9a8d4' },
      { token: 'string', foreground: '86efac' },
      { token: 'number', foreground: 'fdba74' },
    ],
    colors: {
      'editor.background': '#020617',
      'editorLineNumber.foreground': '#64748b',
      'editorLineNumber.activeForeground': '#f8fafc',
      'editorCursor.foreground': '#67e8f9',
      'editor.selectionBackground': '#0f3a54',
      'editor.inactiveSelectionBackground': '#0b2940',
    },
  })
}

export const sharedEditorOptions: editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbersMinChars: 3,
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  bracketPairColorization: { enabled: true },
  fontFamily: "'SFMono-Regular', 'SF Mono', 'Fira Code', monospace",
}
