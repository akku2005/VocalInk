import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Add a custom table module to Quill
const tableModule = {
  container: Quill.import('formats/table-container'),
  row: Quill.import('formats/table-row'),
  cell: Quill.import('formats/table-cell'),
  table: Quill.import('formats/table')
};
Quill.register(tableModule, true);

const modules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{size: []}],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image', 'video'], // These are the key features
    ['clean'],
    ['table'] // Add table to the toolbar
  ],
};

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'ordered', 'bullet', 'indent',
  'link', 'image', 'video',
  'table'
];

const AdvancedRichTextEditor = ({ value, onChange, className }) => {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      formats={formats}
      className={className}
      placeholder="Start writing your blog..."
    />
  );
};

export default AdvancedRichTextEditor;