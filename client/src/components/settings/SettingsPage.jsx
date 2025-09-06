import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import settingsService from '../../services/settingsService';
import { 
  User, 
  Bell, 
  Globe, 
  Palette, 
  Brain, 
  Award as Badge, 
  Shield, 
  Key
} from 'lucide-react';

// Import tab components
import ProfileTab from './ProfileTab';
import AccountTab from './AccountTab';
import NotificationsTab from './NotificationsTab';
import PrivacyTab from './PrivacyTab';
import AppearanceTab from './AppearanceTab';
import AIPreferencesTab from './AIPreferencesTab';
import GamificationTab from './GamificationTab';
import SecurityTab from './SecurityTab';

const SettingsPage = () => {
  const { user, fetchUserProfile } = useAuth();
  const { showToast } = useToast();
  const { tabId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (tabId) {
      setActiveTab(tabId);
    } else {
      // If no tabId in URL, redirect to profile tab
      navigate('/settings/profile', { replace: true });
    }
  }, [tabId, navigate]);

  useEffect(() => {
    if (user && !settings) {
      // Only load settings if we don't have them yet
      loadSettings();
    }
  }, [user, settings]);


  const loadSettings = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const userSettings = await settingsService.getUserSettings(forceRefresh);
      setSettings(userSettings);
      
      if (forceRefresh) {
        await fetchUserProfile(true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Globe },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'ai', name: 'AI Preferences', icon: Brain },
    { id: 'gamification', name: 'Gamification', icon: Badge },
    { id: 'security', name: 'Security', icon: Key }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/settings/${tabId}`);
  };







  // Render the appropriate tab content based on activeTab
  const renderTabContent = () => {
    if (!settings) return <div>Loading settings...</div>;

    switch (activeTab) {
      case 'profile':
        return (
          <ProfileTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            fetchUserProfile={fetchUserProfile}
            loadSettings={loadSettings}
          />
        );
      case 'account':
        return (
          <AccountTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            loadSettings={loadSettings}
          />
        );
      case 'notifications':
        return (
          <NotificationsTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            loadSettings={loadSettings}
          />
        );
      case 'privacy':
        return (
          <PrivacyTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            loadSettings={loadSettings}
          />
        );
      case 'appearance':
        return (
          <AppearanceTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            loadSettings={loadSettings}
          />
        );
      case 'ai':
        return (
          <AIPreferencesTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            loadSettings={loadSettings}
          />
        );
      case 'gamification':
        return (
          <GamificationTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            loadSettings={loadSettings}
          />
        );
      case 'security':
        return (
          <SecurityTab
            settings={settings}
            setSettings={setSettings}
            loading={loading}
            setLoading={setLoading}
            showToast={showToast}
            loadSettings={loadSettings}
          />
        );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar with tabs */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardContent className="p-4">
              <nav>
                <ul className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <li key={tab.id}>
                        <Button
                          variant={activeTab === tab.id ? 'default' : 'ghost'}
                          className={`w-full justify-start ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => handleTabChange(tab.id)}
                        >
                          <Icon className="mr-2 h-4 w-4" />
                          {tab.name}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content area */}
        <div className="w-full md:w-3/4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;