import { useQuery } from '@tanstack/react-query';
import client from '../api/client';

export interface JobStatusResponse {
    success: boolean;
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'not_found' | 'error';
    progress: number;
    result: any;
    error: string | null;
}

/**
 * useJobPolling
 * 
 * Custom hook to poll the Omnora Background Jobs API.
 * Automatically stops polling when the job reaches a terminal state.
 * 
 * @param jobId - The ID of the job to poll. If null, polling is disabled.
 * @param onComplete - Optional callback when job completes successfully.
 * @param onError - Optional callback when job fails.
 */
export const useJobPolling = (
    jobId: string | null, 
    onComplete?: (result: any) => void,
    onError?: (error: string) => void
) => {
    return useQuery<JobStatusResponse>({
        queryKey: ['job', jobId],
        queryFn: async () => {
            const { data } = await client.get(`/jobs/${jobId}`);
            return data;
        },
        enabled: !!jobId,
        refetchInterval: (query) => {
            const data = query.state.data;
            
            // Terminal States
            if (data?.status === 'completed') {
                if (onComplete) onComplete(data.result);
                return false; 
            }
            
            if (data?.status === 'failed' || data?.status === 'error') {
                if (onError) onError(data.error || 'Job failed');
                return false;
            }

            return 3000; // Poll every 3 seconds for active/queued jobs
        },
    });
};
