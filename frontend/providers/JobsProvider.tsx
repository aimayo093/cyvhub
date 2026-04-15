import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Job, JobStatus, DispatchAttempt } from '@/types';
import { apiClient } from '@/services/api';
import { useAuth } from './AuthProvider';
import { useRouter } from 'expo-router';

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

const OFFER_POLL_INTERVAL_MS = 5000;

export const [JobsProvider, useJobs] = createContextHook(() => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<DispatchAttempt | null>(null);
  const [isOnline, setIsOnlineState] = useState(false);
  const { isAuthenticated, userRole } = useAuth();
  const router = useRouter();
  const offerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastOfferIdRef = useRef<string | null>(null);

  // ─── Load Jobs ────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await apiClient('/jobs');
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
      setJobs([]);
      setPendingOffer(null);
      setIsOnlineState(false);
    }
  }, [isAuthenticated, loadJobs]);

  // ─── Offer Polling (driver/carrier only) ─────────────────────────────────
  const pendingOfferRef = useRef<DispatchAttempt | null>(null);
  pendingOfferRef.current = pendingOffer;

  const pollForOffer = useCallback(async () => {
    try {
      const data = await apiClient('/dispatch/offer/pending');
      const offer: DispatchAttempt | null = data?.offer ?? null;

      if (offer && offer.id !== lastOfferIdRef.current) {
        lastOfferIdRef.current = offer.id;
        setPendingOffer(offer);
        router.push('/incoming-job' as any);
      } else if (!offer && pendingOfferRef.current) {
        setPendingOffer(null);
        lastOfferIdRef.current = null;
      }
    } catch {
      // Silently ignore poll errors (network issues, auth)
    }
  }, [router]);

  useEffect(() => {
    const isDriverOrCarrier = userRole === 'driver' || userRole === 'carrier';
    if (!isAuthenticated || !isOnline || !isDriverOrCarrier) {
      if (offerPollRef.current) {
        clearInterval(offerPollRef.current);
        offerPollRef.current = null;
      }
      return;
    }

    pollForOffer();
    offerPollRef.current = setInterval(pollForOffer, OFFER_POLL_INTERVAL_MS);

    return () => {
      if (offerPollRef.current) clearInterval(offerPollRef.current);
    };
  }, [isAuthenticated, isOnline, userRole, pollForOffer]);

  // ─── Availability Toggle ──────────────────────────────────────────────────
  const setOnline = useCallback(async (online: boolean) => {
    try {
      await apiClient('/dispatch/availability', {
        method: 'PATCH',
        body: JSON.stringify({ online }),
      });
      setIsOnlineState(online);
      if (!online) {
        setPendingOffer(null);
        lastOfferIdRef.current = null;
      }
    } catch (e) {
      console.error('Failed to update availability:', e);
      throw e;
    }
  }, []);

  // ─── Accept Offer ─────────────────────────────────────────────────────────
  const acceptOffer = useCallback(async (attemptId: string) => {
    const res = await apiClient(`/dispatch/offer/${attemptId}/accept`, { method: 'POST' });
    setPendingOffer(null);
    lastOfferIdRef.current = null;
    await loadJobs();
    return res;
  }, [loadJobs]);

  // ─── Reject Offer ─────────────────────────────────────────────────────────
  const rejectOffer = useCallback(async (attemptId: string) => {
    await apiClient(`/dispatch/offer/${attemptId}/reject`, { method: 'POST' });
    setPendingOffer(null);
    lastOfferIdRef.current = null;
  }, []);

  // ─── Job Status ───────────────────────────────────────────────────────────
  const updateJobStatus = useCallback(async (jobId: string, newStatus: JobStatus) => {
    try {
      await apiClient(`/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status: newStatus, completedAt: newStatus === 'DELIVERED' ? new Date().toISOString() : job.completedAt }
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
    if (next) updateJobStatus(jobId, next);
  }, [jobs, updateJobStatus]);

  const declineJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && job.status === 'ASSIGNED') {
      await updateJobStatus(jobId, 'PENDING_DISPATCH');
    }
  }, [jobs, updateJobStatus]);

  const failJob = useCallback(async (jobId: string, _reason: string) => {
    await updateJobStatus(jobId, 'FAILED');
  }, [updateJobStatus]);

  const submitPOD = useCallback(async (jobId: string, podData: PODData) => {
    try {
      await apiClient(`/jobs/${jobId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DELIVERED', ...podData }),
      });
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? { ...job, status: 'DELIVERED', completedAt: new Date().toISOString() }
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

  // ─── Admin Actions ────────────────────────────────────────────────────────
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
      setJobs(prev => prev.map(j => j.id === jobId
        ? { ...j, notes: [...(j.notes || []), { text, timestamp: new Date().toISOString() }] }
        : j
      ));
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

  // ─── Derived State ────────────────────────────────────────────────────────
  const activeJobs = useMemo(
    () => jobs.filter(j =>
      ['DRIVER_ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'ARRIVED_DROPOFF'].includes(j.status)
    ),
    [jobs]
  );

  const availableJobs = useMemo(
    () => jobs.filter(j => j.status === 'ASSIGNED' || j.status === 'PENDING_DISPATCH'),
    [jobs]
  );

  const upcomingJobs = useMemo(() => {
    const now = new Date();
    return jobs.filter(j => {
      if (!['ASSIGNED', 'DRIVER_ACCEPTED'].includes(j.status)) return false;
      const pickupStart = new Date(j.pickupWindowStart);
      return pickupStart > now;
    }).sort((a, b) => new Date(a.pickupWindowStart).getTime() - new Date(b.pickupWindowStart).getTime());
  }, [jobs]);

  const completedJobs = useMemo(
    () => jobs.filter(j => j.status === 'DELIVERED' || j.status === 'COMPLETED'),
    [jobs]
  );

  const failedJobs = useMemo(() => jobs.filter(j => j.status === 'FAILED'), [jobs]);
  const currentJob = useMemo(() => activeJobs.length > 0 ? activeJobs[0] : null, [activeJobs]);

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
    // ── Dispatch offer ──────────────────────────────────
    pendingOffer,
    isOnline,
    setOnline,
    acceptOffer,
    rejectOffer,
  };
});

export function useFilteredJobs(filter: 'active' | 'available' | 'upcoming' | 'completed' | 'all') {
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
