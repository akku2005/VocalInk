import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { executeSlashCommand, getAvailableCommands } from '../../utils/slashCommands';
import { useToast } from '../../hooks/useToast';
import { Keyboard, Type, Wand2, Pencil, FileText, Sparkles } from 'lucide-react';

const AdvancedRichTextEditor = ({ value, onChange, className, placeholder }) => {
  const quillRef = useRef(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 });
  const [commandFilter, setCommandFilter] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const { addToast } = useToast();

  const availableCommands = getAvailableCommands();

  // Calculate word and character count
  useEffect(() => {
    if (!value) {
      setWordCount(0);
      setCharCount(0);
      return;
    }
    // Strip HTML tags for counting
    const text = value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    setCharCount(text.length);
    setWordCount(text ? text.split(/\s+/).filter(Boolean).length : 0);
  }, [value]);

  // Detect slash command
  useEffect(() => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();

    const handleTextChange = () => {
      const selection = editor.getSelection();
      if (!selection) return;

      const currentLine = editor.getText(selection.index - 20, 20);
      const slashMatch = currentLine.match(/\/(\w*)$/);

      if (slashMatch) {
        const filter = slashMatch[1];
        setCommandFilter(filter);

        // Get cursor position for menu
        const bounds = editor.getBounds(selection.index);
        setCommandMenuPosition({
          top: bounds.top + bounds.height + 5,
          left: bounds.left
        });
        setShowCommandMenu(true);
      } else {
        setShowCommandMenu(false);
      }
    };

    editor.on('text-change', handleTextChange);

    return () => {
      editor.off('text-change', handleTextChange);
    };
  }, []);

  // Execute command
  const executeCommand = (command) => {
    if (!quillRef.current) return;

    const editor = quillRef.current.getEditor();
    const selection = editor.getSelection();
    if (!selection) return;

    // Get selected text or current line
    const selectedText = editor.getText(selection.index, selection.length);
    const currentText = editor.getText();

    // Remove the slash command text
    const currentLine = editor.getText(selection.index - 20, 20);
    const slashMatch = currentLine.match(/\/([\w\s]*)$/);
    if (slashMatch) {
      const commandLength = slashMatch[0].length;
      editor.deleteText(selection.index - commandLength, commandLength);
    }

    // Execute the command
    const result = executeSlashCommand(command, selectedText, currentText);

    if (result) {
      if (result.action === 'insert') {
        editor.clipboard.dangerouslyPasteHTML(selection.index, result.content);
      } else if (result.action === 'replace' && selection.length > 0) {
        editor.deleteText(selection.index, selection.length);
        editor.clipboard.dangerouslyPasteHTML(selection.index, result.content);
      }

      addToast({
        type: 'success',
        message: `Applied: ${command}`
      });
    }

    setShowCommandMenu(false);
    setCommandFilter('');
  };

  // Filter commands based on input
  const filteredCommands = availableCommands.filter(cmd =>
    cmd.command.toLowerCase().includes(commandFilter.toLowerCase())
  );

  // Handle keyboard navigation for command menu
  useEffect(() => {
    if (!showCommandMenu) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCommandMenu(false);
      } else if (e.key === 'Enter' && filteredCommands.length > 0) {
        e.preventDefault();
        executeCommand(filteredCommands[0].command.split(' ')[0]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCommandMenu, filteredCommands]);

  const modules = React.useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: '1' }, { header: '2' }],
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [
            { list: 'ordered' },
            { list: 'bullet' },
            { indent: '-1' },
            { indent: '+1' },
          ],
          ['link', 'image', 'video'],
          ['clean'],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'code-block',
    'color',
    'background',
    'align',
    'list',
    'indent',
    'link',
    'image',
    'video',
  ];

  // Handle focus/blur events
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  return (
    <div className="relative group">
      {/* Editor Container with enhanced styling */}
      <div 
        className={`
          relative rounded-xl overflow-hidden transition-all duration-300
          ${isFocused 
            ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' 
            : 'ring-1 ring-border hover:ring-border/80'
          }
        `}
      >
        {/* Custom styled ReactQuill */}
        <div 
          className="advanced-editor-wrapper"
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            className={`${className} advanced-quill-editor`}
            placeholder={placeholder || "Start writing your story... (Type '/' for AI commands)"}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-surface-hover/50 border-t border-border/50 text-xs">
          <div className="flex items-center gap-4 text-text-secondary">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
            <span className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              {charCount} {charCount === 1 ? 'character' : 'characters'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-text-secondary/70">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Type</span> <kbd className="px-1.5 py-0.5 rounded bg-background text-[10px] font-mono">/</kbd> <span className="hidden sm:inline">for AI</span>
            </span>
            {isFocused && (
              <span className="flex items-center gap-1 text-primary animate-pulse">
                <Pencil className="w-3 h-3" />
                <span className="hidden sm:inline">Writing</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Custom Editor Styles */}
      <style>{`
        .advanced-quill-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.1)) !important;
          background: var(--surface-hover, rgba(255,255,255,0.02));
          padding: 12px 16px !important;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .advanced-quill-editor .ql-toolbar .ql-formats {
          margin-right: 12px;
        }

        .advanced-quill-editor .ql-container {
          border: none !important;
          font-size: 16px;
          line-height: 1.8;
        }

        .advanced-quill-editor .ql-editor {
          min-height: 350px;
          padding: 24px 28px !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--text-primary, #fff);
        }

        .advanced-quill-editor .ql-editor.ql-blank::before {
          color: var(--text-secondary, rgba(255,255,255,0.4));
          font-style: normal;
          font-size: 16px;
          left: 28px;
          right: 28px;
        }

        .advanced-quill-editor .ql-editor p {
          margin-bottom: 1em;
        }

        .advanced-quill-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: 700;
          margin-bottom: 0.5em;
          color: var(--text-primary, #fff);
        }

        .advanced-quill-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-bottom: 0.5em;
          color: var(--text-primary, #fff);
        }

        .advanced-quill-editor .ql-editor blockquote {
          border-left: 4px solid var(--primary, #6366f1);
          padding-left: 16px;
          margin: 1em 0;
          font-style: italic;
          color: var(--text-secondary, rgba(255,255,255,0.7));
        }

        .advanced-quill-editor .ql-editor pre.ql-syntax {
          background: rgba(0,0,0,0.3);
          border-radius: 8px;
          padding: 16px;
          font-family: 'Fira Code', 'Monaco', monospace;
          font-size: 14px;
          overflow-x: auto;
        }

        .advanced-quill-editor .ql-editor a {
          color: var(--primary, #6366f1);
          text-decoration: underline;
        }

        .advanced-quill-editor .ql-snow .ql-stroke {
          stroke: var(--text-secondary, rgba(255,255,255,0.6));
        }

        .advanced-quill-editor .ql-snow .ql-fill {
          fill: var(--text-secondary, rgba(255,255,255,0.6));
        }

        .advanced-quill-editor .ql-snow .ql-picker {
          color: var(--text-secondary, rgba(255,255,255,0.6));
        }

        .advanced-quill-editor .ql-snow .ql-picker-options {
          background: var(--surface, #1a1a2e);
          border-color: var(--border, rgba(255,255,255,0.1));
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }

        .advanced-quill-editor .ql-toolbar button:hover,
        .advanced-quill-editor .ql-toolbar button.ql-active {
          background: var(--primary, #6366f1) !important;
          border-radius: 6px;
        }

        .advanced-quill-editor .ql-toolbar button:hover .ql-stroke,
        .advanced-quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: white !important;
        }

        .advanced-quill-editor .ql-toolbar button:hover .ql-fill,
        .advanced-quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: white !important;
        }

        /* Dark theme adjustments */
        .dark .advanced-quill-editor .ql-editor {
          color: #e5e5e5;
        }

        .dark .advanced-quill-editor .ql-editor.ql-blank::before {
          color: rgba(255,255,255,0.35);
        }

        /* Sepia theme */
        .sepia .advanced-quill-editor .ql-editor {
          background: #faf8f1;
          color: #3d3929;
        }

        .sepia .advanced-quill-editor .ql-toolbar {
          background: #f5f3ea;
        }
      `}</style>

      {/* Slash Command Menu */}
      {showCommandMenu && filteredCommands.length > 0 && (
        <div
          className="absolute z-50 bg-surface border border-border rounded-lg shadow-2xl overflow-hidden w-80"
          style={{
            top: `${commandMenuPosition.top}px`,
            left: `${commandMenuPosition.left}px`,
          }}
        >
          <div className="bg-surface-hover px-3 py-2 border-b border-border">
            <p className="text-xs font-semibold text-text-secondary uppercase">
              Slash Commands
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => executeCommand(cmd.command.split(' ')[0])}
                className="w-full px-3 py-2 hover:bg-primary/10 transition-colors text-left flex items-start gap-3 group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {cmd.icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-text-primary text-sm">
                    {cmd.command}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {cmd.description}
                  </div>
                  {cmd.needsSelection && (
                    <div className="text-xs text-warning mt-1">
                      ⚠️ Select text first
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="bg-surface-hover px-3 py-2 border-t border-border text-xs text-text-secondary">
            Press <kbd className="px-1 py-0.5 bg-background rounded">Enter</kbd> to apply •{' '}
            <kbd className="px-1 py-0.5 bg-background rounded">Esc</kbd> to cancel
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedRichTextEditor;