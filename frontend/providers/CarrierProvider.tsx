import React, { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Job, JobStatus, FleetVehicle, CarrierRateCard } from '@/types';
import { useAuth } from './AuthProvider';
import { apiClient } from '@/services/api';

const NEXT_STATUS_MAP: Partial<Record<JobStatus, JobStatus>> = {
  ASSIGNED: 'DRIVER_ACCEPTED',
  DRIVER_ACCEPTED: 'EN_ROUTE_TO_PICKUP',
  EN_ROUTE_TO_PICKUP: 'ARRIVED_PICKUP',
  ARRIVED_PICKUP: 'PICKED_UP',
  PICKED_UP: 'EN_ROUTE_TO_DROPOFF',
  EN_ROUTE_TO_DROPOFF: 'ARRIVED_DROPOFF',
  ARRIVED_DROPOFF: 'DELIVERED',
};

export interface CarrierDriver {
  id: string;
  name: string;
  phone: string;
  status: 'AVAILABLE' | 'ON_JOB' | 'OFFLINE';
  vehicleId?: string;
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export const [CarrierProvider, useCarrier] = createContextHook(() => {
  const { userRole, isAuthenticated } = useAuth();
  const [carrierJobs, setCarrierJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [rateCards, setRateCards] = useState<CarrierRateCard[]>([]);
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [coverageRegions, setCoverageRegions] = useState<string[]>([
    'Swansea', 'Cardiff', 'Newport', 'Neath', 'Llanelli', 'Carmarthen', 'Pembrokeshire',
  ]);

  const loadCarrierData = useCallback(async () => {
    if (!isAuthenticated || (userRole !== 'carrier' && userRole !== 'admin')) return;
    setIsLoading(true);
    try {
      const [fleetRes, driversRes, jobsRes, ratesRes] = await Promise.all([
        apiClient('/carriers/my/fleet').catch(() => ({ data: [] })),
        apiClient('/carriers/my/drivers').catch(() => ({ data: [] })),
        apiClient('/jobs').catch(() => ({ data: [], jobs: [] })),
        apiClient('/carriers/my/rates').catch(() => ({ data: [] }))
      ]);
      
      setFleet(fleetRes.data || []);
      setDrivers(driversRes.data || []);
      setRateCards(ratesRes.data || []);
      
      const jobsList = jobsRes.data || jobsRes.jobs || [];
      setCarrierJobs(jobsList.filter((j: Job) => j.status !== 'PENDING_DISPATCH'));
      setAvailableJobs(jobsList.filter((j: Job) => j.status === 'PENDING_DISPATCH'));
    } catch (e) {
      console.error('Failed to load carrier data', e);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userRole]);

  useEffect(() => {
     if (isAuthenticated) loadCarrierData();
  }, [isAuthenticated, loadCarrierData]);

  const assignedJobs = useMemo(
    () => carrierJobs.filter(j => !['DELIVERED', 'FAILED', 'CANCELLED', 'COMPLETED'].includes(j.status)),
    [carrierJobs]
  );

  const activeJobs = useMemo(
    () => carrierJobs.filter(j =>
      ['DRIVER_ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'ARRIVED_DROPOFF'].includes(j.status)
    ),
    [carrierJobs]
  );

  const completedJobs = useMemo(
    () => carrierJobs.filter(j => j.status === 'DELIVERED' || j.status === 'COMPLETED'),
    [carrierJobs]
  );

  const acceptJob = useCallback(async (jobId: string) => {
    try {
        await apiClient(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'ASSIGNED' })
        });
        await loadCarrierData();
    } catch (e) {
        console.error('Failed to accept job:', e);
        throw e;
    }
  }, [loadCarrierData]);

  const rejectJob = useCallback(async (jobId: string) => {
    try {
        await apiClient(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'PENDING_DISPATCH' })
        });
        await loadCarrierData();
    } catch (e) {
        console.error('Failed to reject job:', e);
    }
  }, [loadCarrierData]);

  const advanceJobStatus = useCallback(async (jobId: string) => {
    const job = carrierJobs.find(j => j.id === jobId);
    if (!job) return;
    const next = NEXT_STATUS_MAP[job.status];
    if (!next) return;
    
    try {
        await apiClient(`/jobs/${jobId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: next })
        });
        await loadCarrierData();
    } catch (e) {
        console.error('Failed to advance job status:', e);
    }
  }, [carrierJobs, loadCarrierData]);

  const getJob = useCallback(
    (jobId: string): Job | undefined =>
      carrierJobs.find(j => j.id === jobId) ?? availableJobs.find(j => j.id === jobId),
    [carrierJobs, availableJobs]
  );

  const updateVehicleStatus = useCallback(async (vehicleId: string, status: FleetVehicle['status']) => {
    try {
        await apiClient(`/carriers/my/fleet/${vehicleId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        setFleet(prev => prev.map(v => v.id === vehicleId ? { ...v, status } : v));
    } catch (e) {
        console.error('Failed to update vehicle', e);
    }
  }, []);

  const addVehicle = useCallback(async (vehicle: Omit<FleetVehicle, 'id'>) => {
    try {
        const res = await apiClient('/carriers/my/fleet', {
            method: 'POST',
            body: JSON.stringify(vehicle)
        });
        if (res.data) {
            setFleet(prev => [res.data, ...prev]);
        }
    } catch (e) {
        console.error('Failed to add vehicle', e);
    }
  }, []);

  const addRateCard = useCallback(async (rateCard: Omit<CarrierRateCard, 'id'>) => {
    try {
        const res = await apiClient('/carriers/my/rates', {
            method: 'POST',
            body: JSON.stringify(rateCard)
        });
        if (res.data) {
            setRateCards(prev => [res.data, ...prev]);
        }
    } catch (e) {
        console.error('Failed to add rate card', e);
    }
  }, []);

  const updateRateCard = useCallback(async (id: string, updates: Partial<CarrierRateCard>) => {
    try {
        const res = await apiClient(`/carriers/my/rates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
        if (res.data) {
            setRateCards(prev => prev.map(r => r.id === id ? res.data : r));
        }
    } catch (e) {
        console.error('Failed to update rate card', e);
    }
  }, []);

  const assignDriverToJob = useCallback(async (jobId: string, driverId: string) => {
    try {
        // Need assignment endpoint for carrier drivers
        await apiClient(`/jobs/${jobId}/assign`, {
            method: 'POST',
            body: JSON.stringify({ driverId })
        });
        await loadCarrierData();
    } catch (e) {
        console.error('Failed to assign driver', e);
    }
  }, [loadCarrierData]);

  const updateJobNotes = useCallback(async (jobId: string, notes: string) => {
    try {
        await apiClient(`/jobs/${jobId}/notes`, {
            method: 'POST',
            body: JSON.stringify({ text: notes })
        });
        await loadCarrierData();
    } catch (e) {
        console.error('Failed to update job notes', e);
    }
  }, [loadCarrierData]);

  const updateCoverageRegions = useCallback(async (regions: string[]) => {
    try {
        await apiClient('/carriers/my/profile', {
            method: 'PATCH',
            body: JSON.stringify({ coverageRegions: JSON.stringify(regions) })
        });
        setCoverageRegions(regions);
    } catch (e) {
        console.error('Failed to update regions', e);
    }
  }, []);

  const updateAvailability = useCallback(async (updated: AvailabilitySlot[]) => {
    try {
        await apiClient('/carriers/my/availability', {
            method: 'PATCH',
            body: JSON.stringify({ slots: updated })
        });
        setAvailability(updated);
    } catch (e) {
        console.error('Failed to update availability', e);
    }
  }, []);

  return {
    carrierJobs,
    availableJobs,
    assignedJobs,
    activeJobs,
    completedJobs,
    fleet,
    rateCards,
    drivers,
    availability,
    coverageRegions,
    isLoading,
    refreshCarrierData: loadCarrierData,
    acceptJob,
    rejectJob,
    advanceJobStatus,
    getJob,
    updateVehicleStatus,
    addVehicle,
    addRateCard,
    updateRateCard,
    assignDriverToJob,
    updateJobNotes,
    updateCoverageRegions,
    updateAvailability,
  };
});
