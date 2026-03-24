import React, { useState, useCallback, useEffect, useRef } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { DriverLocation } from '@/types';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthProvider';
import { Platform } from 'react-native';

const SOCKET_SERVER_URL = process.env.EXPO_PUBLIC_SOCKET_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');

export const [LocationProvider, useLocation] = createContextHook(() => {
    const { token, userProfile } = useAuth();
    const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const waypointIndexRef = useRef(0);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        // Initialize socket connection
        socketRef.current = io(SOCKET_SERVER_URL, {
            transports: ['websocket'],
            autoConnect: true
        });

        socketRef.current.on('connect', () => {
            console.log('[LocationProvider] Socket connected', socketRef.current?.id);
            // Send auth token to bind socket to user ID
            socketRef.current?.emit('authenticate', token);
        });

        socketRef.current.on('driver_location_updated', (data: any) => {
            setDriverLocations(prev => {
                const existing = prev.find(d => d.driverId === data.driverId);
                const updatedObj: DriverLocation = {
                    driverId: data.driverId,
                    driverName: existing?.driverName || `Driver ${data.driverId.slice(-4)}`,
                    latitude: data.lat,
                    longitude: data.lng,
                    heading: data.heading || 0,
                    speed: data.speed || 0,
                    status: 'ONLINE',
                    timestamp: data.timestamp
                };
                if (existing) {
                    return prev.map(d => d.driverId === data.driverId ? updatedObj : d);
                }
                return [...prev, updatedObj];
            });
        });

        socketRef.current.on('driver_offline', (data: { driverId: string }) => {
            setDriverLocations(prev => prev.map(d => 
                d.driverId === data.driverId ? { ...d, status: 'OFFLINE' } : d
            ));
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [token]);

    // Simulate driver movement emitting real websocket data to the backend
    const startSimulation = useCallback((driverId: string) => {
        if (simulationRef.current) clearInterval(simulationRef.current);
        waypointIndexRef.current = 0;
        
        // Mock route in Swansea for Demo
        const route = [
             { latitude: 51.6214, longitude: -3.9436 },
             { latitude: 51.6250, longitude: -3.9400 },
             { latitude: 51.6290, longitude: -3.9350 },
        ];

        if (route.length === 0) return;

        simulationRef.current = setInterval(() => {
            const point = route[waypointIndexRef.current];
            const nextPoint = route[Math.min(waypointIndexRef.current + 1, route.length - 1)];
            const heading = Math.atan2(
                nextPoint.longitude - point.longitude,
                nextPoint.latitude - point.latitude
            ) * (180 / Math.PI);

            const locationUpdate = {
                lat: point.latitude,
                lng: point.longitude,
                heading: heading,
                speed: 55 + Math.random() * 15,
            };

            // Update local state for immediate feedback
            setCurrentLocation({ latitude: point.latitude, longitude: point.longitude });
            
            // Emit to live socket server!
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('update_location', locationUpdate);
            }

             if (waypointIndexRef.current >= route.length - 1) {
                waypointIndexRef.current = 0;
            } else {
                waypointIndexRef.current += 1;
            }
        }, 3000);
    }, []);

    const stopSimulation = useCallback(() => {
        if (simulationRef.current) {
            clearInterval(simulationRef.current);
            simulationRef.current = null;
        }
    }, []);

    // Start/stop GPS tracking for the current user (driver role)
    const startTracking = useCallback(async () => {
        try {
            // In production, use expo-location here
            // For demo, use a fixed location in Swansea
            setCurrentLocation({ latitude: 51.6214, longitude: -3.9436 });
            setIsTracking(true);
        } catch (e) {
            // Silently handle location tracking errors in production
        }
    }, []);

    const stopTracking = useCallback(() => {
        setIsTracking(false);
    }, []);

    const getDriverLocation = useCallback((driverId: string): DriverLocation | undefined => {
        return driverLocations.find(d => d.driverId === driverId);
    }, [driverLocations]);

    const getActiveDrivers = useCallback((): DriverLocation[] => {
        return driverLocations.filter(d => d.status !== 'OFFLINE');
    }, [driverLocations]);

    const getAllDrivers = useCallback((): DriverLocation[] => {
        return driverLocations;
    }, [driverLocations]);

    useEffect(() => {
        return () => {
            if (simulationRef.current) clearInterval(simulationRef.current);
        };
    }, []);

    return {
        driverLocations,
        currentLocation,
        isTracking,
        startTracking,
        stopTracking,
        startSimulation,
        stopSimulation,
        getDriverLocation,
        getActiveDrivers,
        getAllDrivers,
    };
});
