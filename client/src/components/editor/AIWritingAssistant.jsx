import { useState } from 'react';
import { X, Sparkles, Loader2, Copy, RotateCcw, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { apiService } from '../../services/api';
import { useToast } from '../../hooks/useToast';

const AIWritingAssistant = ({ isOpen, onClose, onInsertContent }) => {
    const { addToast } = useToast();

    // State
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [generatedContent, setGeneratedContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Tone options
    const tones = [
        { value: 'professional', label: 'Professional', icon: '💼', description: 'Business & authoritative' },
        { value: 'casual', label: 'Casual', icon: '😊', description: 'Friendly & conversational' },
        { value: 'technical', label: 'Technical', icon: '⚙️', description: 'Detailed & precise' },
        { value: 'creative', label: 'Creative', icon: '🎨', description: 'Engaging & storytelling' },
        { value: 'educational', label: 'Educational', icon: '📚', description: 'Clear & instructional' },
    ];

    // Length options
    const lengths = [
        { value: 'short', label: 'Short', wordCount: '~500 words', time: '2-3 min read' },
        { value: 'medium', label: 'Medium', wordCount: '~1000 words', time: '4-5 min read' },
        { value: 'long', label: 'Long', wordCount: '~2000 words', time: '8-10 min read' },
    ];

    // Generate blog content
    const handleGenerate = async () => {
        if (!topic.trim()) {
            addToast({ type: 'warning', message: 'Please enter a topic' });
            return;
        }

        setLoading(true);
        setGeneratedContent('');

        try {
            const response = await apiService.post('/ai/generate-blog', {
                topic: topic.trim(),
                tone,
                length,
                language: 'en'
            });

            if (response.data.success && response.data.data.content) {
                setGeneratedContent(response.data.data.content);
                addToast({ type: 'success', message: 'Blog generated successfully!' });
            } else {
                throw new Error('No content generated');
            }
        } catch (error) {
            console.error('AI generation error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to generate blog content';
            addToast({ type: 'error', message: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    // Copy to editor
    const handleCopyToEditor = () => {
        if (!generatedContent) return;

        onInsertContent(generatedContent);
        setCopied(true);
        addToast({ type: 'success', message: 'Content copied to editor!' });

        setTimeout(() => {
            onClose();
            setCopied(false);
        }, 500);
    };

    // Regenerate
    const handleRegenerate = () => {
        handleGenerate();
    };

    // Clear
    const handleClear = () => {
        setTopic('');
        setGeneratedContent('');
        setCopied(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">AI Writing Assistant</h2>
                            <p className="text-sm text-text-secondary">Generate blog content with AI</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Topic Input */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            What do you want to write about? *
                        </label>
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., How to build a scalable web application with React and Node.js"
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-text-primary placeholder:text-text-secondary"
                            rows={3}
                        />
                        <p className="text-xs text-text-secondary">
                            Be specific for better results. Include key points you want covered.
                        </p>
                    </div>

                    {/* Tone Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">Tone</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {tones.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setTone(t.value)}
                                    className={`p-3 rounded-lg border-2 transition-all text-left ${tone === t.value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{t.icon}</div>
                                    <div className="text-sm font-medium text-text-primary">{t.label}</div>
                                    <div className="text-xs text-text-secondary">{t.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Length Selector */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">Length</label>
                        <div className="grid grid-cols-3 gap-2">
                            {lengths.map((l) => (
                                <button
                                    key={l.value}
                                    onClick={() => setLength(l.value)}
                                    className={`p-3 rounded-lg border-2 transition-all text-center ${length === l.value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="text-sm font-medium text-text-primary">{l.label}</div>
                                    <div className="text-xs text-text-secondary">{l.wordCount}</div>
                                    <div className="text-xs text-text-secondary">{l.time}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !topic.trim()}
                        loading={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 text-lg font-semibold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5 mr-2" />
                                Generate Blog Content
                            </>
                        )}
                    </Button>

                    {/* Generated Content */}
                    {generatedContent && (
                        <div className="space-y-3 pt-4 border-t border-border">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-success" />
                                    Generated Content
                                </h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRegenerate}
                                        disabled={loading}
                                    >
                                        <RotateCcw className="w-4 h-4 mr-1" />
                                        Regenerate
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleClear}
                                    >
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-background rounded-lg p-4 border border-border max-h-[400px] overflow-y-auto">
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                                />
                            </div>

                            <Button
                                onClick={handleCopyToEditor}
                                disabled={copied}
                                className="w-full bg-primary hover:bg-primary-600 text-white py-3"
                            >
                                {copied ? (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Copied to Editor!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-5 h-5 mr-2" />
                                        Copy to Editor
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIWritingAssistant;
