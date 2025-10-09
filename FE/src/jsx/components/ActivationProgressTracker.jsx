import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    IconButton,
    Collapse,
    Chip,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button,
    Alert,
} from '@mui/material';
import {
    Close,
    ExpandMore,
    ExpandLess,
    CheckCircle,
    Error,
    HourglassEmpty,
    Email as EmailIcon,
    Person as PersonIcon,
} from '@mui/icons-material';
import { getActivationProgressApi } from '../../Api/Service';

/**
 * Persistent Activation Progress Tracker
 * Shows bulk activation progress and persists across page refreshes
 */
const ActivationProgressTracker = () => {
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [progress, setProgress] = useState(null);

    // Load progress from localStorage on mount and poll backend for updates
    useEffect(() => {
        let pollInterval = null;

        const loadProgress = async () => {
            const stored = localStorage.getItem('activationProgress');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    console.log('📦 Loaded progress from localStorage:', parsed);
                    
                    // Only show if not completed or recently completed (within 2 minutes)
                    if (!parsed.completed || (Date.now() - parsed.completedAt < 120000)) {
                        // If there's a sessionId, ALWAYS fetch from backend first to get fresh data
                        if (parsed.sessionId) {
                            console.log('🔍 SessionId found, fetching fresh data from backend...');
                            try {
                                const response = await getActivationProgressApi(parsed.sessionId);
                                console.log('📦 Backend response on mount:', response);
                                
                                if (response && response.success && response.data) {
                                    const backendProgress = {
                                        ...response.data,
                                        sessionId: parsed.sessionId,
                                        completedAt: response.data.completed ? Date.now() : undefined
                                    };
                                    
                                    console.log('✅ Using fresh backend data:', backendProgress);
                                    localStorage.setItem('activationProgress', JSON.stringify(backendProgress));
                                    setProgress(backendProgress);
                                    setVisible(true);
                                    
                                    // Continue polling if not completed
                                    if (!backendProgress.completed) {
                                        startBackendPolling(parsed.sessionId);
                                    }
                                    return;
                                } else {
                                    console.warn('⚠️ Backend returned no data, using localStorage');
                                }
                            } catch (err) {
                                console.warn('⚠️ Failed to fetch from backend, using localStorage:', err.message);
                                // If backend fetch fails, fall back to localStorage data
                            }
                        }
                        
                        // Fallback: Use localStorage data if no sessionId or backend fetch failed
                        console.log('📂 Using localStorage data as fallback');
                        setProgress(parsed);
                        setVisible(true);
                        
                        // Start polling if needed
                        if (parsed.sessionId && !parsed.completed) {
                            if (!pollInterval) {
                                startBackendPolling(parsed.sessionId);
                            }
                        }
                    } else {
                        // Clean up old completed progress
                        console.log('🗑️ Cleaning up old completed progress');
                        localStorage.removeItem('activationProgress');
                        setVisible(false);
                        setProgress(null);
                    }
                } catch (e) {
                    console.error('❌ Failed to parse activation progress:', e);
                }
            } else {
                // No progress in localStorage
                console.log('📭 No progress in localStorage');
                setVisible(false);
                setProgress(null);
            }
        };

        // Poll backend for real-time progress updates
        const startBackendPolling = (sessionId) => {
            console.log('🔔 Starting backend polling for session:', sessionId);
            
            const pollBackendProgress = async () => {
                try {
                    console.log('🌐 Fetching progress from backend...');
                    const response = await getActivationProgressApi(sessionId);
                    console.log('📦 Backend API response:', response);
                    
                    if (response && response.success && response.data) {
                        const backendProgress = response.data;
                        console.log('✅ Received backend progress:', backendProgress);
                        
                        // Update localStorage with latest from backend
                        const updatedProgress = {
                            ...backendProgress,
                            sessionId: sessionId,  // Ensure sessionId is present
                            completedAt: backendProgress.completed ? Date.now() : undefined
                        };
                        
                        console.log('💾 Updating localStorage with backend data:', updatedProgress);
                        localStorage.setItem('activationProgress', JSON.stringify(updatedProgress));
                        
                        // Only update state if data has changed
                        setProgress(prev => {
                            const hasChanged = JSON.stringify(prev) !== JSON.stringify(updatedProgress);
                            if (hasChanged) {
                                console.log('📊 Backend data changed, updating state');
                                return updatedProgress;
                            }
                            return prev;
                        });
                        
                        setVisible(prev => prev || true);
                        
                        // Stop polling if completed
                        if (backendProgress.completed) {
                            console.log('🏁 Activation completed, stopping polling');
                            if (pollInterval) {
                                clearInterval(pollInterval);
                                pollInterval = null;
                            }
                        }
                    } else {
                        console.warn('⚠️ Backend response missing data:', response);
                    }
                } catch (err) {
                    console.error('❌ Error polling backend:', err);
                    
                    // If session not found (404), progress might be completed/expired
                    if (err.response?.status === 404) {
                        console.log('❌ 404: Activation session expired or not found');
                        if (pollInterval) {
                            clearInterval(pollInterval);
                            pollInterval = null;
                        }
                    } else {
                        console.error('❌ Other error:', err.message);
                    }
                }
            };

            // Poll immediately, then every 2 seconds
            pollBackendProgress();
            pollInterval = setInterval(pollBackendProgress, 2000);
        };

        // Initial load
        loadProgress();

        // Listen for storage changes (from other tabs/windows or same window)
        const handleStorageChange = (e) => {
            if (e.key === 'activationProgress') {
                console.log('📢 Storage event detected:', e.key);
                if (e.newValue) {
                    try {
                        const parsed = JSON.parse(e.newValue);
                        console.log('📥 Parsed storage event data:', parsed);
                        
                        // Only update if data has changed
                        setProgress(prev => {
                            const hasChanged = JSON.stringify(prev) !== JSON.stringify(parsed);
                            return hasChanged ? parsed : prev;
                        });
                        
                        setVisible(prev => prev || true);
                        
                        // Start polling if needed
                        if (parsed.sessionId && !parsed.completed && !pollInterval) {
                            startBackendPolling(parsed.sessionId);
                        }
                    } catch (err) {
                        console.error('Failed to parse storage event:', err);
                    }
                } else {
                    setVisible(prev => prev ? false : prev);
                    setProgress(prev => prev ? null : prev);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also poll localStorage every 500ms for same-window updates (more frequent)
        const localCheckInterval = setInterval(() => {
            const stored = localStorage.getItem('activationProgress');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    
                    // Only update if data has changed
                    setProgress(prev => {
                        const hasChanged = JSON.stringify(prev) !== JSON.stringify(parsed);
                        return hasChanged ? parsed : prev;
                    });
                    
                    setVisible(prev => prev || true);
                    
                    // Ensure backend polling is running if needed
                    if (parsed.sessionId && !parsed.completed && !pollInterval) {
                        console.log('🔄 Starting backend polling from localStorage check');
                        startBackendPolling(parsed.sessionId);
                    }
                } catch (e) {
                    console.error('Failed to check localStorage:', e);
                }
            } else {
                // No progress in localStorage - use functional updates
                setVisible(prev => prev ? false : prev);
                setProgress(prev => prev ? null : prev);
            }
        }, 500);  // Check every 500ms for faster response

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(localCheckInterval);
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, []);  // Empty dependency array - only run once on mount

    const handleClose = () => {
        setVisible(false);
        localStorage.removeItem('activationProgress');
        setProgress(null);
    };

    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };

    if (!visible || !progress) {
        // Debug: Log why not visible
        console.log('❌ ActivationProgressTracker not visible. visible:', visible, 'progress:', progress);
        return null;
    }

    console.log('✅ ActivationProgressTracker rendering with progress:', progress);

    const {
        total = 0,
        activated = 0,
        skipped = 0,
        failed = 0,
        emailsSent = 0,
        emailsFailed = 0,
        emailsPending = 0,
        percentage = 0,
        msg = '',
        completed = false,
        type = 'progress',
        emailLimitReached = false
    } = progress;

    console.log('📊 Displaying stats - activated:', activated, 'emailsSent:', emailsSent, 'emailsFailed:', emailsFailed, 'total:', total);
    
    // Detect SMTP rate limit issues
    const hasEmailFailures = emailsFailed > 0;
    const emailFailureRate = emailsFailed / (emailsSent + emailsFailed || 1);
    const smtpLimitIssue = emailLimitReached || (emailsFailed > 5 && emailFailureRate > 0.3);

    const processed = activated + skipped + failed;
    const isProcessingUsers = processed < total;
    const isProcessingEmails = emailsPending > 0 || (activated > 0 && emailsSent < activated);

    // Generate clearer status messages
    const getStatusMessage = () => {
        if (completed) {
            if (activated > 0) {
                return `Successfully activated ${activated} lead${activated !== 1 ? 's' : ''} to users!`;
            }
            return 'Process completed';
        }
        
        if (isProcessingUsers) {
            return `Activating leads... ${processed} of ${total}`;
        }
        
        if (isProcessingEmails) {
            return `Sending welcome emails... ${emailsSent} of ${activated}`;
        }
        
        return msg || 'Processing...';
    };

    const statusMessage = getStatusMessage();

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                width: 400,
                zIndex: 9999,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
        >
            <Paper elevation={8} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {/* Header */}
                <Box
                    sx={{
                        background: completed
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={handleToggleExpand}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {completed ? (
                            <CheckCircle />
                        ) : (
                            <HourglassEmpty className="rotating" />
                        )}
                        <Typography variant="h6" fontWeight="bold">
                            {completed 
                                ? `✓ ${activated} Lead${activated !== 1 ? 's' : ''} Activated`
                                : 'Activating Leads...'
                            }
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                            size="small"
                            sx={{ color: 'white' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand();
                            }}
                        >
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                        <IconButton
                            size="small"
                            sx={{ color: 'white' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                        >
                            <Close />
                        </IconButton>
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <Box sx={{ p: 2 }}>
                        {/* Status Message - More prominent */}
                        <Box
                            sx={{
                                mb: 2,
                                p: 1.5,
                                backgroundColor: completed ? '#e8f5e9' : '#e3f2fd',
                                borderRadius: 2,
                                border: `2px solid ${completed ? '#4caf50' : '#2196f3'}`,
                            }}
                        >
                            <Typography 
                                variant="body1" 
                                fontWeight="medium"
                                sx={{ 
                                    color: completed ? '#2e7d32' : '#1565c0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                {completed ? '✓' : '⏳'} {statusMessage}
                            </Typography>
                        </Box>

                        {/* Progress Bar */}
                        {!completed && (
                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Progress
                                    </Typography>
                                    <Typography variant="caption" fontWeight="bold" color="primary">
                                        {percentage}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={percentage}
                                    sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#e0e0e0',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                        },
                                    }}
                                />
                            </Box>
                        )}

                        {/* Summary Stats */}
                        <Box sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                            gap: 1.5,
                            mb: 2 
                        }}>
                            {/* Users Created */}
                            <Box sx={{ 
                                textAlign: 'center', 
                                p: 1.5, 
                                bgcolor: '#f1f8e9',
                                borderRadius: 2,
                                border: '1px solid #c5e1a5'
                            }}>
                                <Typography variant="h5" fontWeight="bold" color="#558b2f">
                                    {activated}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Users Created
                                </Typography>
                            </Box>

                            {/* Emails Sent */}
                            {(emailsSent > 0 || completed) && (
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 1.5, 
                                    bgcolor: '#e3f2fd',
                                    borderRadius: 2,
                                    border: '1px solid #90caf9'
                                }}>
                                    <Typography variant="h5" fontWeight="bold" color="#1565c0">
                                        {emailsSent}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Emails Sent
                                    </Typography>
                                </Box>
                            )}

                            {/* Skipped */}
                            {skipped > 0 && (
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 1.5, 
                                    bgcolor: '#fff3e0',
                                    borderRadius: 2,
                                    border: '1px solid #ffcc80'
                                }}>
                                    <Typography variant="h5" fontWeight="bold" color="#e65100">
                                        {skipped}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Skipped
                                    </Typography>
                                </Box>
                            )}

                            {/* Failed */}
                            {failed > 0 && (
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 1.5, 
                                    bgcolor: '#ffebee',
                                    borderRadius: 2,
                                    border: '1px solid #ef9a9a'
                                }}>
                                    <Typography variant="h5" fontWeight="bold" color="#c62828">
                                        {failed}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Failed
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Email Progress Indicator (simplified) */}
                        {!completed && emailsPending > 0 && (
                            <Box sx={{ 
                                p: 1.5, 
                                bgcolor: smtpLimitIssue ? '#ffebee' : '#f3e5f5',
                                borderRadius: 2,
                                border: smtpLimitIssue ? '2px solid #f44336' : '1px dashed #ba68c8',
                                mb: 2
                            }}>
                                <Typography 
                                    variant="body2" 
                                    color={smtpLimitIssue ? "error.main" : "text.secondary"}
                                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: smtpLimitIssue ? 'bold' : 'normal' }}
                                >
                                    <EmailIcon sx={{ fontSize: 18 }} />
                                    {smtpLimitIssue 
                                        ? `⚠️ SMTP rate limit reached! ${emailsSent} sent, ${emailsFailed} failed`
                                        : 'Sending welcome emails in background...'
                                    }
                                </Typography>
                            </Box>
                        )}

                        {/* SMTP Rate Limit Warning (Critical Alert) */}
                        {smtpLimitIssue && (
                            <Alert 
                                severity="error" 
                                sx={{ mb: 2 }}
                                icon={<Error />}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    SMTP Rate Limit Exceeded!
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                    {emailsFailed} of {emailsSent + emailsFailed} emails failed. Your email provider has rate limits.
                                    {completed ? ' Users were created successfully - you may need to resend emails manually.' : ''}
                                </Typography>
                            </Alert>
                        )}

                        {/* Email Failed Warning (for non-limit issues) */}
                        {emailsFailed > 0 && !smtpLimitIssue && completed && (
                            <Box sx={{ 
                                p: 1.5, 
                                bgcolor: '#fff3e0',
                                borderRadius: 2,
                                border: '1px solid #ff9800',
                                mb: 2
                            }}>
                                <Typography variant="body2" color="warning.dark">
                                    ⚠️ {emailsFailed} email{emailsFailed !== 1 ? 's' : ''} failed to send. Users were created successfully.
                                </Typography>
                            </Box>
                        )}

                        {/* Action buttons when completed */}
                        {completed && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: 'column' }}>
                                {emailsFailed > 0 && (
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        color="warning"
                                        onClick={() => {
                                            // Navigate to failed emails page
                                            window.location.href = '#/admin/crm/failed-emails';
                                        }}
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        View & Resend {emailsFailed} Failed Email{emailsFailed !== 1 ? 's' : ''}
                                    </Button>
                                )}
                                <Button
                                    fullWidth
                                    variant={emailsFailed > 0 ? "outlined" : "contained"}
                                    onClick={handleClose}
                                >
                                    Dismiss
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Collapse>
            </Paper>

            {/* CSS for rotating animation */}
            <style>{`
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .rotating {
                    animation: rotate 2s linear infinite;
                }
            `}</style>
        </Box>
    );
};

export default ActivationProgressTracker;

