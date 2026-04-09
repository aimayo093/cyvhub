import React, { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Job, JobStatus } from '@/types';
import { apiClient } from '@/services/api';
import { useAuth } from './AuthProvider';

type JobFilter = 'active' | 'available' | 'upcoming' | 'completed' | 'all';

const NEXT_STATUS_MAP: Partial<Record<JobStatus, JobStatus>> = {
  ASSIGNED: 'DRIVER_ACCEPTED',
  DRIVER_ACCEPTED: 'EN_ROUTE_TO_PICKUP',
  EN_ROUTE_TO_PICKUP: 'ARRIVED_PICKUP',
  ARRIVED_PICKUP: 'PICKED_UP',
  PICKED_UP: 'EN_ROUTE_TO_DROPOFF',
  EN_ROUTE_TO_DROPOFF: 'ARRIVED_DROPOFF',
  ARRIVED_DROPOFF: 'DELIVERED',
};

interface PODData {
  receiverName: string;
  podUrl?: string;
  signatureUrl?: string;
  signatureCaptured?: boolean;
  photoCount?: number;
  notes?: string;
}

export const [JobsProvider, useJobs] = createContextHook(() => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const loadJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await apiClient('/jobs');
      // Fix: Support both { jobs: [] } and { data: [] } response formats
      const jobsList = data.data || data.jobs || [];
      setJobs(jobsList);
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadJobs();
    } else {
      setJobs([]); // Clear jobs when logged out
    }
  }, [isAuthenticated, loadJobs]);

  const updateJobStatus = useCallback(async (jobId: string, newStatus: JobStatus) => {
    try {
      await apiClient(`/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? {
            ...job,
            status: newStatus,
            completedAt: newStatus === 'DELIVERED' ? new Date().toISOString() : job.completedAt,
          }
          : job
      ));
    } catch (error) {
      console.error('Failed to update job status:', error);
      alert('Failed to update job status');
    }
  }, []);

  const advanceJobStatus = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const next = NEXT_STATUS_MAP[job.status];
    if (next) {
      updateJobStatus(jobId, next);
    }
  }, [jobs, updateJobStatus]);

  const declineJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && job.status === 'ASSIGNED') {
      await updateJobStatus(jobId, 'PENDING_DISPATCH');
    }
  }, [jobs, updateJobStatus]);

  const failJob = useCallback(async (jobId: string, reason: string) => {
    await updateJobStatus(jobId, 'FAILED');
    // For real implementation we'd probably have an endpoint for failure reasons
  }, [updateJobStatus]);

  const submitPOD = useCallback(async (jobId: string, podData: PODData) => {
    try {
      await apiClient(`/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'DELIVERED',
          ...podData
        }),
      });

      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? {
            ...job,
            status: 'DELIVERED',
            receiverName: podData.receiverName,
            podUrl: podData.podUrl,
            signatureUrl: podData.signatureUrl,
            completedAt: new Date().toISOString(),
          }
          : job
      ));
    } catch (error) {
      console.error('Failed to submit POD:', error);
      alert('Failed to submit Proof of Delivery');
    }
  }, []);

  const getJob = useCallback(
    (jobId: string): Job | undefined => jobs.find(j => j.id === jobId),
    [jobs]
  );

  const activeJobs = useMemo(
    () =>
      jobs.filter(j =>
        ['DRIVER_ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'ARRIVED_DROPOFF'].includes(j.status)
      ),
    [jobs]
  );

  const assignJob = useCallback(async (jobId: string, assignee: { driverId?: string; carrierId?: string }) => {
    try {
      await apiClient(`/jobs/${jobId}/assign`, {
        method: 'POST',
        body: JSON.stringify(assignee),
      });
      await loadJobs();
    } catch (error) {
      console.error('Failed to assign job:', error);
      throw error;
    }
  }, [loadJobs]);

  const cancelJob = useCallback(async (jobId: string, reason: string) => {
    try {
      await apiClient(`/jobs/${jobId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      await loadJobs();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  }, [loadJobs]);

  const addJobNote = useCallback(async (jobId: string, text: string) => {
    try {
       await apiClient(`/jobs/${jobId}/notes`, {
         method: 'POST',
         body: JSON.stringify({ text }),
       });
       setJobs(prev => prev.map(j => j.id === jobId ? { ...j, notes: [...(j.notes || []), { text, timestamp: new Date().toISOString() }] } : j));
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }, []);

  const adminUpdateJob = useCallback(async (jobId: string, updates: Partial<Job>) => {
    try {
      await apiClient(`/jobs/${jobId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      await loadJobs();
    } catch (error) {
      console.error('Failed to update job:', error);
      throw error;
    }
  }, [loadJobs]);

  const adminCreateJob = useCallback(async (jobData: any) => {
    try {
      const res = await apiClient('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });
      await loadJobs();
      return res.data || res;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  }, [loadJobs]);

  const availableJobs = useMemo(
    () => jobs.filter(j => j.status === 'ASSIGNED' || j.status === 'PENDING_DISPATCH'),
    [jobs]
  );

  const upcomingJobs = useMemo(
    () => {
      const now = new Date();
      return jobs.filter(j => {
        if (!['ASSIGNED', 'DRIVER_ACCEPTED'].includes(j.status)) return false;
        const pickupStart = new Date(j.pickupWindowStart);
        return pickupStart > now;
      }).sort((a, b) => new Date(a.pickupWindowStart).getTime() - new Date(b.pickupWindowStart).getTime());
    },
    [jobs]
  );

  const completedJobs = useMemo(
    () => jobs.filter(j => j.status === 'DELIVERED' || j.status === 'COMPLETED'),
    [jobs]
  );

  const failedJobs = useMemo(
    () => jobs.filter(j => j.status === 'FAILED'),
    [jobs]
  );

  const currentJob = useMemo(
    () => activeJobs.length > 0 ? activeJobs[0] : null,
    [activeJobs]
  );

  return {
    jobs,
    isLoading,
    refreshJobs: loadJobs,
    activeJobs,
    availableJobs,
    upcomingJobs,
    completedJobs,
    failedJobs,
    currentJob,
    getJob,
    updateJobStatus,
    advanceJobStatus,
    declineJob,
    failJob,
    assignJob,
    cancelJob,
    addJobNote,
    adminUpdateJob,
    adminCreateJob,
    submitPOD,
  };
});

export function useFilteredJobs(filter: JobFilter) {
  const { jobs, activeJobs, availableJobs, upcomingJobs, completedJobs } = useJobs();
  return useMemo(() => {
    switch (filter) {
      case 'active': return activeJobs;
      case 'available': return availableJobs;
      case 'upcoming': return upcomingJobs;
      case 'completed': return completedJobs;
      default: return jobs;
    }
  }, [filter, jobs, activeJobs, availableJobs, upcomingJobs, completedJobs]);
}
