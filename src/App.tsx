import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Save, Trash2, Plus, X, Edit2, Wand2 } from "lucide-react";
import { usePyodide } from "./hooks/usePyodide";
import { useAICompletions } from "./hooks/useAICompletions";
import axios from 'axios';

// Define the file tab type
interface FileTab {
  name: string;
  code: string;
}

const defaultFile: FileTab = { name: "main.py", code: 'print("Welcome to PySculptor")\n' };

function PySculptorIcon() {
  // Simple stylized S with a chisel/hammer motif
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pysculptor-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7f5af0" />
          <stop offset="1" stopColor="#2cb67d" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="url(#pysculptor-gradient)" stroke="#fff" strokeWidth="2" />
      <path d="M11 21c0 2 2 3 5 3s5-1 5-3-2-3-5-3-5-1-5-3 2-3 5-3 5 1 5 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="22" y="7" width="2" height="8" rx="1" fill="#fff" transform="rotate(20 22 7)" />
    </svg>
  );
}

function App() {
  // File management state
  const [files, setFiles] = useState<FileTab[]>(() => {
    const saved = localStorage.getItem("pysculptor_files");
    return saved ? JSON.parse(saved) : [defaultFile];
  });
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [renamingIdx, setRenamingIdx] = useState<number>(-1);
  const [newName, setNewName] = useState<string>("");

  // Pyodide
  const { runPython, isLoading, error, output, clearOutput } = usePyodide();
  const [isExecuting, setIsExecuting] = useState(false);

  // Activate AI code completions
  useAICompletions();

  // Monaco editor ref
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Modal state for AI prompt
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [aiPromptLoading, setAIPromptLoading] = useState(false);

  // Save files to localStorage
  useEffect(() => {
    localStorage.setItem("pysculptor_files", JSON.stringify(files));
  }, [files]);

  // Keyboard shortcut for running code
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        handleRun();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [files, activeIdx, handleRun]);

  // File actions
  const addFile = () => {
    let base = "untitled.py";
    let i = 1;
    let name = base;
    while (files.some((f: FileTab) => f.name === name)) {
      name = `untitled${i}.py`;
      i++;
    }
    setFiles([...files, { name, code: "" }]);
    setActiveIdx(files.length);
  };

  const removeFile = (idx: number) => {
    if (files.length === 1) return; // Don't remove last file
    const newFiles = files.filter((_, i: number) => i !== idx);
    setFiles(newFiles);
    setActiveIdx(idx === 0 ? 0 : idx - 1);
  };

  const renameFile = (idx: number, name: string) => {
    setFiles(files.map((f: FileTab, i: number) => (i === idx ? { ...f, name } : f)));
    setRenamingIdx(-1);
  };

  const setCode = (code: string) => {
    setFiles(files.map((f: FileTab, i: number) => (i === activeIdx ? { ...f, code } : f)));
  };

  async function handleRun() {
    if (isExecuting || isLoading) return;
    setIsExecuting(true);
    try {
      await runPython(files[activeIdx].code);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExecuting(false);
    }
  }

  const handleSave = () => {
    const file = files[activeIdx];
    const blob = new Blob([file.code], { type: 'text/python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Magic wand AI suggestion (now opens modal)
  const handleAISuggestion = () => {
    setShowPrompt(true);
    setPromptText("");
  };

  // Handle prompt submit
  const handlePromptSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || !editorRef.current || !monacoRef.current) return;
    setAIPromptLoading(true);
    try {
     const apiBase = import.meta.env.VITE_API_BASE_URL || '';
     const res = await axios.post(`${apiBase}/api/generate`, { prompt: promptText });
      const suggestion = res.data.suggestion;
      const editor = editorRef.current;
      const monaco = monacoRef.current;
      const position = editor.getPosition();
      if (suggestion && position) {
        editor.executeEdits("ai-suggestion", [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column
            ),
            text: suggestion,
            forceMoveMarkers: true,
          },
        ]);
        editor.focus();
      }
      setShowPrompt(false);
      setPromptText("");
    } catch (err) {
      // Optionally show error
    } finally {
      setAIPromptLoading(false);
    }
  };

  // Monaco onMount handler
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  return (
    <div className="h-screen flex flex-col font-sans">
      {/* Gradient Header */}
      <header className="h-16 flex items-center px-6 border-b shadow bg-gradient-to-r from-[#7f5af0] via-[#5fbbff] to-[#2cb67d]">
        <div className="flex items-center gap-3">
          <PySculptorIcon />
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow">PySculptor</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleAISuggestion}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-md border border-white/20 hover:bg-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="AI Prompt to Code"
          >
            <Wand2 size={18} />
            <span>AI Suggest</span>
          </motion.button>
          <motion.button
            onClick={handleRun}
            disabled={isLoading || isExecuting}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md disabled:bg-gray-500 transition-colors border border-white/20 hover:bg-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={18} />
            <span>{isLoading ? "Loading..." : isExecuting ? "Running..." : "Run Code"}</span>
          </motion.button>
          <motion.button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-md transition-colors border border-white/20 hover:bg-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save size={18} />
            <span>Save</span>
          </motion.button>
        </div>
      </header>
      {/* AI Prompt Modal */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.form
              onSubmit={handlePromptSubmit}
              className="bg-[#232336] rounded-lg shadow-lg p-6 w-full max-w-md flex flex-col gap-4 border border-[#7f5af0]"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg text-white">Enter your Prompt</span>
                <button type="button" onClick={() => setShowPrompt(false)} className="text-white/60 hover:text-white"><X size={20} /></button>
              </div>
              <textarea
                className="w-full min-h-[60px] rounded bg-[#181825] text-white p-2 border border-[#353552] focus:outline-none focus:border-[#7f5af0] resize-none"
                placeholder="Describe what you want to generate (e.g. 'sort a list of numbers')"
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                disabled={aiPromptLoading}
                autoFocus
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7f5af0] to-[#2cb67d] text-white rounded-md font-semibold disabled:opacity-60"
                disabled={aiPromptLoading || !promptText.trim()}
              >
                {aiPromptLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <Wand2 size={18} />
                )}
                Generate
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 min-h-0">
        {/* Sidebar for files */}
        <aside className="w-56 bg-[#232336] border-r border-[#1a1a2e] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a2e]">
            <span className="text-sm font-semibold text-white/80">Files</span>
            <button onClick={addFile} className="p-1 rounded hover:bg-[#353552] text-white/80" title="Add file">
              <Plus size={18} />
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto">
            {files.map((file: FileTab, idx: number) => (
              <li key={file.name} className={
                `flex items-center group px-2 py-1.5 cursor-pointer ${idx === activeIdx ? 'bg-[#353552] text-white' : 'text-white/80 hover:bg-[#2d2d44]'}`
              }>
                {renamingIdx === idx ? (
                  <form onSubmit={e => { e.preventDefault(); renameFile(idx, newName || file.name); }} className="flex-1 flex items-center gap-1">
                    <input
                      autoFocus
                      className="bg-[#232336] border border-[#444] rounded px-1 py-0.5 text-sm text-white w-24"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onBlur={() => setRenamingIdx(-1)}
                    />
                    <button type="submit" className="text-xs px-1 text-green-400">OK</button>
                  </form>
                ) : (
                  <>
                    <span onClick={() => setActiveIdx(idx)} className="flex-1 truncate select-none">{file.name}</span>
                    <button onClick={() => { setRenamingIdx(idx); setNewName(file.name); }} className="ml-1 p-0.5 rounded hover:bg-[#444]" title="Rename">
                      <Edit2 size={14} />
                    </button>
                    {files.length > 1 && (
                      <button onClick={() => removeFile(idx)} className="ml-1 p-0.5 rounded hover:bg-[#444]" title="Delete">
                        <X size={14} />
                      </button>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </aside>
        {/* Main editor and output */}
        <main className="flex-1 min-w-0">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={60} minSize={20}>
              <Editor
                height="100%"
                language="python"
                theme="vs-dark"
                value={files[activeIdx].code}
                onChange={(value) => setCode(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  padding: { top: 10 },
                }}
                onMount={handleEditorMount}
              />
            </Panel>
            <PanelResizeHandle className="w-1 bg-[#232336]" />
            <Panel defaultSize={40} minSize={20}>
              <div className="h-full bg-[#181825] flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-[#232336]">
                  <h2 className="text-md font-semibold text-white/60">Console Output</h2>
                  <button onClick={clearOutput} className="p-1 rounded-md hover:bg-[#232336]" title="Clear output">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex-grow p-4 font-mono text-sm overflow-auto text-white/90">
                  {error && <pre className="text-red-400">{error.message}</pre>}
                  <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </main>
      </div>
      <footer className="h-8 flex items-center justify-between px-4 bg-gradient-to-r from-[#7f5af0] via-[#5fbbff] to-[#2cb67d] text-white text-sm">
        <div className="text-white-400 text-sm">
          © 2025 PySculptor. All rights reserved.
        </div>
        <div>Ready</div>
        <div>Python 3.11 (via Pyodide)</div>
      </footer>
    </div>
  );
}

export default App;
