import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Save, Sun, Moon, Monitor } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import settingsService from '../../services/settingsService';

const AppearanceTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  loadSettings 
}) => {
  const { showToast } = useToast();
  const { appearanceSettings, updateAppearanceSettings } = useTheme();
  const appearance = settings?.appearance || appearanceSettings;

  const handleToggle = (section, field) => {
    const newValue = !appearance[field];
    
    // Update local settings state
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: newValue,
      },
    }));

    // Update theme context immediately for instant visual feedback
    updateAppearanceSettings({ [field]: newValue });
  };

  const handleInputChange = (section, field, value) => {
    // Update local settings state
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value,
      },
    }));

    // Update theme context immediately for instant visual feedback
    updateAppearanceSettings({ [field]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsService.updateAppearanceSection({ theme: appearance.theme });
      showToast('Theme saved successfully!', 'success');
      if (loadSettings) {
        await loadSettings(true); // Force refresh
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      showToast('Failed to save theme', 'error');
    } finally {
      setLoading(false);
    }
  };

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor }
  ];


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-medium">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-3">
            Theme
          </label>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  onClick={() => {
                    handleInputChange('appearance', 'theme', themeOption.value);
                  }}
                  className={`p-4 border-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-2 cursor-pointer ${
                    appearance.theme === themeOption.value
                      ? "border-primary-500 bg-primary-50"
                      : "border-border hover:border-primary-200"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{themeOption.label}</span>
                </button>
              );
            })}
          </div>
        </div>


        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            loading={loading}
            className="flex items-center gap-2 bg-primary-500 text-white hover:bg-primary-600"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceTab;
