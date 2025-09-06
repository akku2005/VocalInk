import React from 'react';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

const ToastTest = () => {
  const { showToast } = useToast();

  const testToasts = [
    { type: 'success', message: 'Success toast test!' },
    { type: 'error', message: 'Error toast test!' },
    { type: 'warning', message: 'Warning toast test!' },
    { type: 'info', message: 'Info toast test!' }
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Toast Test Page</h1>
        <p className="text-text-secondary mb-6">
          This page tests the toast notification system. Click the buttons below to trigger different types of toasts.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {testToasts.map((toast, index) => (
            <Button
              key={index}
              onClick={() => showToast(toast.message, toast.type)}
              className={`p-4 text-white font-medium rounded-lg ${
                toast.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
                toast.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                toast.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
                'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              Test {toast.type.charAt(0).toUpperCase() + toast.type.slice(1)} Toast
            </Button>
          ))}
        </div>

        <div className="mt-8 p-4 bg-secondary-100 rounded-lg">
          <h2 className="font-semibold text-text-primary mb-2">Expected Behavior:</h2>
          <ul className="text-text-secondary space-y-1">
            <li>• Toasts should appear in the top-right corner</li>
            <li>• Each toast should auto-dismiss after 4-6 seconds</li>
            <li>• Toasts should have different colors based on type</li>
            <li>• You should be able to manually close toasts with the X button</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ToastTest;
