import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const AppearanceTest = () => {
  const { appearanceSettings, updateAppearanceSettings, actualTheme } = useTheme();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    setDebugInfo({
      rootFontSize: computedStyle.fontSize,
      fontSizeScale: computedStyle.getPropertyValue('--font-size-scale'),
      dataTheme: root.getAttribute('data-theme'),
      dataFontSize: root.getAttribute('data-font-size'),
      dataColorScheme: root.getAttribute('data-color-scheme'),
      classList: Array.from(root.classList),
      appearanceSettings,
      actualTheme
    });
  }, [appearanceSettings, actualTheme]);

  const testFontSize = (size) => {
    updateAppearanceSettings({ fontSize: size });
  };

  const testTheme = (theme) => {
    updateAppearanceSettings({ theme });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Appearance Settings Test</h1>
      
      {/* Font Size Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Font Size Test</h2>
        <div className="flex gap-2 mb-4">
          {['small', 'medium', 'large', 'extra-large'].map(size => (
            <button
              key={size}
              onClick={() => testFontSize(size)}
              className={`px-4 py-2 rounded ${
                appearanceSettings.fontSize === size 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs">Extra small text (text-xs)</p>
          <p className="text-sm">Small text (text-sm)</p>
          <p className="text-base">Base text (text-base)</p>
          <p className="text-lg">Large text (text-lg)</p>
          <p className="text-xl">Extra large text (text-xl)</p>
          <h3 className="text-2xl">Heading 2xl</h3>
        </div>
      </div>

      {/* Theme Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Theme Test</h2>
        <div className="flex gap-2 mb-4">
          {['light', 'dark', 'system'].map(theme => (
            <button
              key={theme}
              onClick={() => testTheme(theme)}
              className={`px-4 py-2 rounded ${
                appearanceSettings.theme === theme 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
        <p>Current theme: {appearanceSettings.theme}</p>
        <p>Actual theme: {actualTheme}</p>
      </div>

      {/* Other Settings Test */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Other Settings Test</h2>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={appearanceSettings.compactMode || false}
              onChange={(e) => updateAppearanceSettings({ compactMode: e.target.checked })}
            />
            Compact Mode
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={appearanceSettings.showAnimations !== false}
              onChange={(e) => updateAppearanceSettings({ showAnimations: e.target.checked })}
            />
            Show Animations
          </label>
          <div className="flex items-center gap-2">
            <label>Color Scheme:</label>
            <select
              value={appearanceSettings.colorScheme || 'default'}
              onChange={(e) => updateAppearanceSettings({ colorScheme: e.target.value })}
              className="px-2 py-1 border rounded"
            >
              <option value="default">Default</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="red">Red</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default AppearanceTest;
