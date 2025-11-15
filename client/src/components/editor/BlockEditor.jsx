import { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  Link2, 
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Table,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading
} from 'lucide-react';
import TableBuilder from './TableBuilder';

const BlockEditor = ({ value, onChange, onImageUpload }) => {
  const editorRef = useRef(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file && onImageUpload) {
        const imageUrl = await onImageUpload(file);
        if (imageUrl) {
          const img = `<img src="${imageUrl}" alt="Uploaded image" style="max-width: 100%; height: auto; margin: 20px 0; border-radius: 8px;" />`;
          handleFormat('insertHTML', img);
        }
      }
    };
    input.click();
  };

  const handleLinkInsert = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    const url = prompt('Enter URL:', 'https://');
    
    if (url) {
      if (selectedText) {
        handleFormat('createLink', url);
      } else {
        const linkText = prompt('Enter link text:', url);
        if (linkText) {
          const link = `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${linkText}</a>`;
          handleFormat('insertHTML', link);
        }
      }
    }
  };

  const handleTableInsert = (tableHTML) => {
    handleFormat('insertHTML', tableHTML);
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 50,
        left: rect.left + rect.width / 2
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  };

  return (
    <div className="relative">
      {/* Floating Toolbar */}
      {showToolbar && (
        <div 
          className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl p-2 flex items-center gap-1"
          style={{ 
            top: `${toolbarPosition.top}px`, 
            left: `${toolbarPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-gray-700 rounded" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-gray-700 rounded" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-gray-700 rounded" title="Underline">
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-600 mx-1"></div>
          <button onClick={handleLinkInsert} className="p-2 hover:bg-gray-700 rounded" title="Link">
            <Link2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleFormat('formatBlock', 'blockquote')} className="p-2 hover:bg-gray-700 rounded" title="Quote">
            <Quote className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        <select 
          onChange={(e) => handleFormat('formatBlock', e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button onClick={() => handleFormat('bold')} className="p-2 hover:bg-gray-100 rounded" title="Bold (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('italic')} className="p-2 hover:bg-gray-100 rounded" title="Italic (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('underline')} className="p-2 hover:bg-gray-100 rounded" title="Underline (Ctrl+U)">
          <Underline className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('strikeThrough')} className="p-2 hover:bg-gray-100 rounded" title="Strikethrough">
          <span className="text-sm line-through">S</span>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button onClick={() => handleFormat('insertUnorderedList')} className="p-2 hover:bg-gray-100 rounded" title="Bullet List">
          <List className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('insertOrderedList')} className="p-2 hover:bg-gray-100 rounded" title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button onClick={() => handleFormat('justifyLeft')} className="p-2 hover:bg-gray-100 rounded" title="Align Left">
          <AlignLeft className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('justifyCenter')} className="p-2 hover:bg-gray-100 rounded" title="Align Center">
          <AlignCenter className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('justifyRight')} className="p-2 hover:bg-gray-100 rounded" title="Align Right">
          <AlignRight className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button onClick={handleLinkInsert} className="p-2 hover:bg-gray-100 rounded" title="Insert Link">
          <Link2 className="w-4 h-4" />
        </button>
        <button onClick={handleImageUpload} className="p-2 hover:bg-gray-100 rounded" title="Insert Image">
          <ImageIcon className="w-4 h-4" />
        </button>
        <button onClick={() => setShowTableBuilder(true)} className="p-2 hover:bg-gray-100 rounded" title="Insert Table">
          <Table className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('formatBlock', 'blockquote')} className="p-2 hover:bg-gray-100 rounded" title="Quote">
          <Quote className="w-4 h-4" />
        </button>
        <button onClick={() => handleFormat('formatBlock', 'pre')} className="p-2 hover:bg-gray-100 rounded" title="Code Block">
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        dangerouslySetInnerHTML={{ __html: value }}
        className="min-h-[500px] p-8 focus:outline-none prose prose-lg max-w-none"
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          lineHeight: '1.8'
        }}
      />

      {/* Table Builder Modal */}
      <TableBuilder
        isOpen={showTableBuilder}
        onClose={() => setShowTableBuilder(false)}
        onInsert={handleTableInsert}
      />
    </div>
  );
};

export default BlockEditor;
