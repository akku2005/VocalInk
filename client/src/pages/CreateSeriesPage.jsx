import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { apiService } from '../services/api';
import { Save, BookOpen, Image as ImageIcon, Plus, Trash2, GripVertical, Sparkles } from 'lucide-react';

const debounce = (fn, delay) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
};

const defaultEpisode = (index = 1) => ({ title: '', status: 'draft', order: index, readTime: 0 });

const CreateSeriesPage = () => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    summary: '',
    category: 'Technology',
    template: 'educational_course',
    difficulty: 'beginner',
    visibility: 'public',
    tags: [],
    coverImage: '',
  });
  const [episodes, setEpisodes] = useState([defaultEpisode(1)]);
  const [tagQuery, setTagQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [errors, setErrors] = useState([]);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const suggestedTags = ['Technology','AI','Programming','Design','Marketing','Education','Lifestyle','Science'];
  const filteredTags = useMemo(() => suggestedTags.filter(t => t.toLowerCase().includes(tagQuery.toLowerCase()) && !form.tags.includes(t)).slice(0,6), [tagQuery, form.tags]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addTag = (tag) => {
    if (!tag) return; const t = tag.trim();
    if (t && !form.tags.includes(t) && form.tags.length < 5) setForm(prev => ({ ...prev, tags: [...prev.tags, t] }));
  };
  const removeTag = (tag) => setForm(prev => ({ ...prev, tags: prev.tags.filter(x => x !== tag) }));

  const addEpisode = () => setEpisodes(prev => [...prev, defaultEpisode(prev.length + 1)]);
  const updateEpisode = (idx, key, value) => setEpisodes(prev => prev.map((ep, i) => i === idx ? { ...ep, [key]: value } : ep));
  const removeEpisode = (idx) => setEpisodes(prev => prev.filter((_, i) => i !== idx).map((ep, i) => ({ ...ep, order: i + 1 })));

  const handleCoverUpload = async () => {
    try {
      const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files?.[0]; if (!file) return;
        const resp = await apiService.upload('/uploads/image', file);
        const url = resp.data.url.startsWith('http') ? resp.data.url : `/api${resp.data.url}`;
        handleChange('coverImage', url);
      };
      input.click();
    } catch (e) { console.warn('Cover upload failed', e); }
  };

  const debouncedPersist = debounce((data) => {
    try { localStorage.setItem('createSeriesDraft', JSON.stringify(data)); setLastSavedAt(new Date()); } catch (e) { console.warn('Persist draft failed', e); }
  }, 800);

  useEffect(() => {
    try { const saved = localStorage.getItem('createSeriesDraft'); if (saved) { const parsed = JSON.parse(saved); setForm(prev => ({ ...prev, ...parsed.form })); setEpisodes(parsed.episodes || [defaultEpisode(1)]); } } catch {}
  }, []);

  useEffect(() => { debouncedPersist({ form, episodes }); }, [form, episodes]);

  const validate = () => {
    const e = [];
    if (!form.title.trim()) e.push('Title is required');
    if (episodes.length === 0) e.push('Add at least one episode');
    if (form.tags.length === 0) e.push('Add at least one tag');
    setErrors(e); return e.length === 0;
  };

  const saveDraft = async () => {
    setLoading(true); try { await new Promise(r => setTimeout(r, 600)); } finally { setLoading(false); }
  };

  const publish = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = { ...form, episodes };
      await apiService.post('/series', payload);
      localStorage.removeItem('createSeriesDraft');
    } catch (e) {
      console.error('Publish failed', e);
    } finally { setLoading(false); setShowPublish(false); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Create New Series</h1>
          <p className="text-text-secondary">Bundle related posts into an engaging learning journey</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={saveDraft} loading={loading} className="flex items-center gap-2"><Save className="w-4 h-4"/>Save Draft</Button>
          <Button onClick={() => setShowPublish(true)} loading={loading} className="flex items-center gap-2"><BookOpen className="w-4 h-4"/>Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Title *</label>
                <input type="text" placeholder="Series title" value={form.title} onChange={(e)=>handleChange('title', e.target.value)} className="w-full bg-transparent outline-none text-3xl font-extrabold tracking-tight placeholder:text-text-secondary border-b border-transparent focus:border-border pb-2"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
                <Input type="text" placeholder="A short description" value={form.description} onChange={(e)=>handleChange('description', e.target.value)}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Summary</label>
                <Input type="text" placeholder="SEO summary for previews" value={form.summary} onChange={(e)=>handleChange('summary', e.target.value)}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Category</label>
                  <select value={form.category} onChange={(e)=>handleChange('category', e.target.value)} className="w-full p-3 border border-border rounded-lg bg-background text-text-primary">
                    {['Technology','Lifestyle','Marketing','Creative','Finance','Education'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Template</label>
                  <select value={form.template} onChange={(e)=>handleChange('template', e.target.value)} className="w-full p-3 border border-border rounded-lg bg-background text-text-primary">
                    <option value="educational_course">Educational course</option>
                    <option value="research_journey">Research journey</option>
                    <option value="story_arc">Story arc</option>
                    <option value="step_by_step">Step by step</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Difficulty</label>
                  <select value={form.difficulty} onChange={(e)=>handleChange('difficulty', e.target.value)} className="w-full p-3 border border-border rounded-lg bg-background text-text-primary">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1">Visibility</label>
                  <select value={form.visibility} onChange={(e)=>handleChange('visibility', e.target.value)} className="w-full p-3 border border-border rounded-lg bg-background text-text-primary">
                    <option value="public">Public</option>
                    <option value="premium">Premium</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Tags (max 5)</label>
                <div className="flex gap-2 mb-2">
                  <Input type="text" placeholder="Add a tag" value={tagQuery} onChange={(e)=>setTagQuery(e.target.value)} onKeyPress={(e)=>{ if (e.key==='Enter'){ addTag(tagQuery); setTagQuery(''); } }} />
                  <Button onClick={()=>{addTag(tagQuery); setTagQuery('');}} size="sm">Add</Button>
                </div>
                {filteredTags.length>0 && (
                  <div className="flex flex-wrap gap-2 mb-2">{filteredTags.map(t => <button key={t} onClick={()=>addTag(t)} className="px-2 py-1 rounded bg-secondary-100 hover:bg-secondary-200 text-xs">{t}</button>)}</div>
                )}
                {form.tags.length>0 && (
                  <div className="flex flex-wrap gap-2">{form.tags.map(t => <Badge key={t} variant="default" className="flex items-center gap-1">{t}<button onClick={()=>removeTag(t)} className="ml-1 hover:text-error">×</button></Badge>)}{form.tags.length>=5 && <span className="text-xs text-text-secondary">Max 5</span>}</div>
                )}
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Cover image</label>
                <div className="flex gap-2">
                  <Input type="text" placeholder="Paste image URL" value={form.coverImage} onChange={(e)=>handleChange('coverImage', e.target.value)} />
                  <Button variant="outline" onClick={handleCoverUpload}><ImageIcon className="w-4 h-4"/> Upload</Button>
                </div>
                {form.coverImage && <img src={form.coverImage} alt="Cover" className="mt-2 w-full rounded border border-border" />}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between"><span>Episodes</span><Button variant="outline" size="sm" onClick={addEpisode} className="flex items-center gap-1"><Plus className="w-4 h-4"/>Add</Button></CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {episodes.map((ep, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center border border-border rounded-lg p-3">
                  <div className="col-span-12 md:col-span-6 flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-text-secondary"/>
                    <Input type="text" placeholder={`Episode ${idx+1} title`} value={ep.title} onChange={(e)=>updateEpisode(idx,'title',e.target.value)} />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <select value={ep.status} onChange={(e)=>updateEpisode(idx,'status',e.target.value)} className="w-full p-2 border border-border rounded bg-background text-text-primary">
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                  <div className="col-span-3 md:col-span-2 flex items-center gap-2">
                    <Input type="number" min={0} value={ep.readTime} onChange={(e)=>updateEpisode(idx,'readTime',Number(e.target.value)||0)} />
                    <span className="text-xs text-text-secondary">min</span>
                  </div>
                  <div className="col-span-3 md:col-span-2 flex justify-end">
                    <Button variant="outline" onClick={()=>removeEpisode(idx)} className="flex items-center gap-1"><Trash2 className="w-4 h-4"/>Remove</Button>
                  </div>
                </div>
              ))}
              {episodes.length===0 && <div className="text-sm text-text-secondary">No episodes yet. Add one to get started.</div>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary-500"/>Tips</CardTitle></CardHeader>
            <CardContent className="p-6 text-sm text-text-secondary space-y-2">
              <p>• Keep titles short and descriptive.</p>
              <p>• Aim for consistent episode lengths.</p>
              <p>• Use the template that best fits your structure.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={showPublish} onClose={()=>setShowPublish(false)} title="Publish series">
        <div className="space-y-3">
          {errors.length>0 && (
            <div className="p-3 rounded border border-error/40 text-error text-sm">
              <ul className="list-disc pl-5">{errors.map(er => <li key={er}>{er}</li>)}</ul>
            </div>
          )}
          <p className="text-sm text-text-secondary">Ready to publish this series? You can always edit later.</p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={()=>setShowPublish(false)}>Cancel</Button>
          <Button onClick={publish} loading={loading}>Publish</Button>
        </div>
      </Modal>

      <div className="text-xs text-text-secondary">{lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : ''}</div>
    </div>
  );
};

export default CreateSeriesPage; 