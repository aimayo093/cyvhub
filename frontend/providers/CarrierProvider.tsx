import React, { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Job, JobStatus, FleetVehicle, CarrierRateCard } from '@/types';

const NEXT_STATUS_MAP: Partial<Record<JobStatus, JobStatus>> = {
  ASSIGNED: 'EN_ROUTE_TO_PICKUP',
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
  const [carrierJobs, setCarrierJobs] = useState<Job[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [fleet, setFleet] = useState<FleetVehicle[]>([]);
  const [rateCards, setRateCards] = useState<CarrierRateCard[]>([]);
  const [drivers, setDrivers] = useState<CarrierDriver[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [coverageRegions, setCoverageRegions] = useState<string[]>([
    'Swansea', 'Cardiff', 'Newport', 'Neath', 'Llanelli', 'Carmarthen', 'Pembrokeshire',
  ]);

  const loadCarrierData = useCallback(async () => {
    try {
      // Assuming api wrapper returns { data: ... } 
      const [fleetRes, driversRes, jobsRes] = await Promise.all([
        apiClient('/carriers/my/fleet').catch(() => ({ data: [] })),
        apiClient('/carriers/my/drivers').catch(() => ({ data: [] })),
        apiClient('/jobs').catch(() => ({ jobs: [] }))
      ]);
      
      setFleet(fleetRes.data || []);
      setDrivers(driversRes.data || []);
      
      if (jobsRes.jobs) {
         setCarrierJobs(jobsRes.jobs.filter((j: Job) => j.status !== 'PENDING_DISPATCH'));
         setAvailableJobs(jobsRes.jobs.filter((j: Job) => j.status === 'PENDING_DISPATCH'));
      }
    } catch (e) {
      console.error('Failed to load carrier data', e);
    }
  }, []);

  React.useEffect(() => {
     loadCarrierData();
  }, [loadCarrierData]);

  const assignedJobs = useMemo(
    () => carrierJobs.filter(j => !['DELIVERED', 'FAILED', 'CANCELLED'].includes(j.status)),
    [carrierJobs]
  );

  const activeJobs = useMemo(
    () => carrierJobs.filter(j =>
      ['EN_ROUTE_TO_PICKUP', 'ARRIVED_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'ARRIVED_DROPOFF'].includes(j.status)
    ),
    [carrierJobs]
  );

  const completedJobs = useMemo(
    () => carrierJobs.filter(j => j.status === 'DELIVERED'),
    [carrierJobs]
  );

  const activeFleet = useMemo(
    () => fleet.filter(v => v.status === 'ACTIVE'),
    [fleet]
  );

  const activeRateCards = useMemo(
    () => rateCards.filter(r => r.status === 'ACTIVE'),
    [rateCards]
  );

  const availableDrivers = useMemo(
    () => drivers.filter(d => d.status === 'AVAILABLE'),
    [drivers]
  );

  const acceptJob = useCallback((jobId: string) => {
    const job = availableJobs.find(j => j.id === jobId);
    if (job) {
      const accepted: Job = { ...job, status: 'ASSIGNED', assignedCarrier: 'SwiftHaul Logistics' };
      setCarrierJobs(prev => [accepted, ...prev]);
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
    }
  }, [availableJobs]);

  const rejectJob = useCallback((jobId: string) => {
    setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  const advanceJobStatus = useCallback((jobId: string) => {
    setCarrierJobs(prev =>
      prev.map(job => {
        if (job.id !== jobId) return job;
        const next = NEXT_STATUS_MAP[job.status];
        if (!next) return job;
        return {
          ...job,
          status: next,
          completedAt: next === 'DELIVERED' ? new Date().toISOString() : job.completedAt,
        };
      })
    );
  }, []);

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

  const addRateCard = useCallback((rateCard: Omit<CarrierRateCard, 'id'>) => {
    const newCard: CarrierRateCard = {
      ...rateCard,
      id: `rc-${Date.now()}`,
    };
    setRateCards(prev => [newCard, ...prev]);
  }, []);

  const updateRateCard = useCallback((id: string, updates: Partial<CarrierRateCard>) => {
    setRateCards(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const assignDriverToJob = useCallback((jobId: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, status: 'ON_JOB' as const } : d));
  }, [drivers]);

  const updateJobNotes = useCallback((jobId: string, notes: string) => {
    setCarrierJobs(prev =>
      prev.map(job => job.id === jobId ? { ...job, specialInstructions: notes } : job)
    );
  }, []);

  const updateCoverageRegions = useCallback((regions: string[]) => {
    // Logic for updating regions
    setCoverageRegions(regions);
  }, []);

  const updateAvailability = useCallback((updated: AvailabilitySlot[]) => {
    // Logic for updating availability
    setAvailability(updated);
  }, []);

  return {
    carrierJobs,
    availableJobs,
    assignedJobs,
    activeJobs,
    completedJobs,
    fleet,
    activeFleet,
    rateCards,
    activeRateCards,
    drivers,
    availableDrivers,
    availability,
    coverageRegions,
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
