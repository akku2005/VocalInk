import React, { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { executeSlashCommand, getAvailableCommands } from '../../utils/slashCommands';
import { useToast } from '../../hooks/useToast';

const AdvancedRichTextEditor = ({ value, onChange, className }) => {
  const quillRef = useRef(null);
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ top: 0, left: 0 });
  const [commandFilter, setCommandFilter] = useState('');
  const { addToast } = useToast();

  const availableCommands = getAvailableCommands();

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
      toolbar: [
        [{ header: '1' }, { header: '2' }, { font: [] }],
        [{ size: [] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [
          { list: 'ordered' },
          { list: 'bullet' },
          { indent: '-1' },
          { indent: '+1' },
        ],
        ['link', 'image', 'video'],
        ['clean'],
      ],
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
    'list',
    'indent',
    'link',
    'image',
    'video',
  ];

  return (
    <div className="relative">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className={className}
        placeholder="Start writing... (Type '/' for commands)"
      />

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