import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Brain, Mic, Volume2, Languages, Save } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';

const AIPreferencesTab = ({ 
  settings, 
  setSettings, 
  loading, 
  setLoading, 
  loadSettings 
}) => {
  const { showToast } = useToast();
  const ai = settings?.ai || {};

  const handleInputChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleToggle = (section, field) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section]?.[field],
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Saving AI Preferences settings:', settings.ai);
      
      await settingsService.updateAISection(settings.ai);
      
      // Force refresh to get updated data
      await loadSettings(true);
      
      showToast('AI preferences saved successfully', 'success');
    } catch (error) {
      console.error('Error saving AI preferences:', error);
      showToast(error.message || 'Failed to save AI preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Preferences</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Preferred Voice
          </label>
          <select
            value={ai?.preferredVoice || 'default'}
            onChange={(e) => handleInputChange('ai', 'preferredVoice', e.target.value)}
            className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
          >
            <option value="default">Default</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Language
          </label>
          <select
            value={ai?.language || 'en'}
            onChange={(e) => handleInputChange('ai', 'language', e.target.value)}
            className="w-full p-2 border border-border rounded-lg bg-background text-text-primary"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Auto Summarize</h3>
              <p className="text-sm text-text-secondary">Automatically generate summaries for your content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ai?.autoSummarize || false}
                onChange={() => handleToggle('ai', 'autoSummarize')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">Speech to Text</h3>
              <p className="text-sm text-text-secondary">Enable voice input for content creation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={ai?.speechToText || false}
                onChange={() => handleToggle('ai', 'speechToText')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-secondary-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
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

export default AIPreferencesTab;
