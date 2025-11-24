import { X } from 'lucide-react';
import CollaboratorsTab from './CollaboratorsTab';

const CollaboratorModal = ({ series, isOpen, onClose, onUpdate }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/50 backdrop-blur-md">
                    <div>
                        <h2 className="text-2xl font-bold text-text-primary">Manage Collaborators</h2>
                        <p className="text-text-secondary text-sm">Invite others to help build this series</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-secondary hover:text-text-primary"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <CollaboratorsTab series={series} onUpdate={onUpdate} />
                </div>
            </div>
        </div>
    );
};

export default CollaboratorModal;
