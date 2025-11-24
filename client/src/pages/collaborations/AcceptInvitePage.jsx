import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import seriesService from '../../services/seriesService';
import { useToast } from '../../hooks/useToast';

const AcceptInvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying invitation...');
    const [seriesId, setSeriesId] = useState(null);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        const acceptInvite = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid invitation link.');
                return;
            }

            try {
                // We could add a manual "Accept" button instead of auto-accepting
                // But auto-accepting on page load is smoother if the user is logged in.
                // If not logged in, the API might fail (401).
                // We should probably check if user is logged in first?
                // The API requires auth. If 401, the interceptor might redirect to login.
                // Let's assume the user is logged in or will be redirected.

                // Actually, let's show a button to confirm acceptance.
                // It prevents accidental acceptance if they just clicked the link to see what it is.
                setStatus('confirm');
                setMessage('You have been invited to collaborate.');
            } catch (error) {
                console.error('Error verifying invite:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Failed to verify invitation.');
            }
        };

        acceptInvite();
    }, [token]);

    const handleConfirmAccept = async () => {
        try {
            setStatus('processing');
            const response = await seriesService.acceptInvite(token);
            setStatus('success');
            setMessage('Invitation accepted successfully!');
            setSeriesId(response.seriesId);
            showSuccess('Invitation accepted!');

            // Redirect after a short delay
            setTimeout(() => {
                navigate(`/series/${response.seriesId}/edit`); // Or wherever the editor is
            }, 2000);
        } catch (error) {
            console.error('Error accepting invite:', error);
            setStatus('error');
            setMessage(error.response?.data?.message || 'Failed to accept invitation.');
            showError('Failed to accept invitation');
        }
    };

    const handleReject = async () => {
        try {
            setStatus('processing');
            await seriesService.rejectInvite(token);
            setStatus('rejected');
            setMessage('Invitation declined.');
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Error rejecting invite:', error);
            setStatus('error');
            setMessage('Failed to reject invitation.');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md bg-surface border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-text-primary">Verifying Invitation...</h2>
                    </>
                )}

                {status === 'confirm' && (
                    <>
                        <div className="w-16 h-16 bg-sky-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-sky-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">Accept Invitation?</h2>
                        <p className="text-text-secondary">
                            You have been invited to collaborate on a series. Do you want to accept this invitation?
                        </p>
                        <div className="flex gap-4 justify-center pt-4">
                            <Button variant="ghost" onClick={handleReject}>Decline</Button>
                            <Button onClick={handleConfirmAccept} className="bg-sky-500 hover:bg-sky-600 text-white">
                                Accept Invitation
                            </Button>
                        </div>
                    </>
                )}

                {status === 'processing' && (
                    <>
                        <Loader2 className="w-12 h-12 text-sky-500 animate-spin mx-auto" />
                        <h2 className="text-xl font-bold text-text-primary">Processing...</h2>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">Welcome Aboard!</h2>
                        <p className="text-text-secondary">{message}</p>
                        <Button onClick={() => navigate(`/series/${seriesId}/edit`)} className="w-full bg-green-500 hover:bg-green-600 text-white">
                            Go to Series <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </>
                )}

                {status === 'rejected' && (
                    <>
                        <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-8 h-8 text-gray-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">Invitation Declined</h2>
                        <p className="text-text-secondary">{message}</p>
                        <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full">
                            Go to Dashboard
                        </Button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-text-primary">Oops!</h2>
                        <p className="text-red-400">{message}</p>
                        <Button onClick={() => navigate('/dashboard')} variant="ghost" className="w-full">
                            Go to Dashboard
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default AcceptInvitePage;
