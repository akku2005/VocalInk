import { useState } from 'react';
import { Plus, Minus, Check, X } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const TableBuilder = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableData, setTableData] = useState(
    Array(3).fill(null).map(() => Array(3).fill(''))
  );

  const handleRowsChange = (delta) => {
    const newRows = Math.max(1, Math.min(10, rows + delta));
    setRows(newRows);
    
    if (delta > 0) {
      setTableData([...tableData, Array(cols).fill('')]);
    } else if (delta < 0 && tableData.length > 1) {
      setTableData(tableData.slice(0, -1));
    }
  };

  const handleColsChange = (delta) => {
    const newCols = Math.max(1, Math.min(10, cols + delta));
    setCols(newCols);
    
    setTableData(tableData.map(row => {
      if (delta > 0) {
        return [...row, ''];
      } else if (delta < 0 && row.length > 1) {
        return row.slice(0, -1);
      }
      return row;
    }));
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newData = [...tableData];
    newData[rowIndex][colIndex] = value;
    setTableData(newData);
  };

  const generateTableHTML = () => {
    let html = '<table style="border-collapse: collapse; width: 100%; margin: 20px 0;">';
    
    tableData.forEach((row, rowIndex) => {
      html += '<tr>';
      row.forEach((cell, colIndex) => {
        const isHeader = rowIndex === 0;
        const tag = isHeader ? 'th' : 'td';
        const style = `border: 1px solid #ddd; padding: 12px; text-align: left; ${isHeader ? 'background-color: #f8f9fa; font-weight: 600;' : ''}`;
        html += `<${tag} style="${style}">${cell || (isHeader ? `Header ${colIndex + 1}` : `Cell ${rowIndex}-${colIndex}`)}</${tag}>`;
      });
      html += '</tr>';
    });
    
    html += '</table><p><br></p>';
    return html;
  };

  const handleInsert = () => {
    const html = generateTableHTML();
    onInsert(html);
    onClose();
    
    // Reset
    setRows(3);
    setCols(3);
    setTableData(Array(3).fill(null).map(() => Array(3).fill('')));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insert Table">
      <div className="space-y-4">
        {/* Size Controls */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rows
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRowsChange(-1)}
                disabled={rows <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{rows}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRowsChange(1)}
                disabled={rows >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Columns
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleColsChange(-1)}
                disabled={cols <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{cols}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleColsChange(1)}
                disabled={cols >= 10}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Table Preview */}
        <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-auto">
          <table className="w-full border-collapse">
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        placeholder={rowIndex === 0 ? `Header ${colIndex + 1}` : `Cell`}
                        className="w-full px-2 py-1 text-sm border-none focus:outline-none focus:ring-1 focus:ring-primary rounded"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleInsert}>
            <Check className="w-4 h-4 mr-2" />
            Insert Table
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TableBuilder;
