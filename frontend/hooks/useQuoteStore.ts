import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Parcel = {
  id: string;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  quantity: number;
  description?: string;
};

export type QuoteFormState = {
  // Step 1 — Addresses & Contacts
  fromAddress: string;
  fromPostcode: string;
  senderPhone: string;
  toAddress: string;
  toPostcode: string;
  receiverPhone: string;

  // Calculated from addresses
  totalDistanceMiles: number | null;

  // Step 2 — Parcels
  parcels: Parcel[];

  // Step 3 / pricing
  estimatedPrice: number | null;
  selectedServiceType: string | null;
  selectedVehicleType: string | null;

  // Actions
  setStep1: (data: Partial<Pick<QuoteFormState, 'fromAddress' | 'fromPostcode' | 'senderPhone' | 'toAddress' | 'toPostcode' | 'receiverPhone'>>) => void;
  setStep2: (parcels: Parcel[]) => void;
  setStep3: (pricing: Partial<Pick<QuoteFormState, 'estimatedPrice' | 'selectedServiceType' | 'selectedVehicleType'>>) => void;
  setDistance: (miles: number | null) => void;
  resetForm: () => void;
};

const initialState = {
  fromAddress: '',
  fromPostcode: '',
  senderPhone: '',
  toAddress: '',
  toPostcode: '',
  receiverPhone: '',
  totalDistanceMiles: null,
  parcels: [{ id: '1', lengthCm: null, widthCm: null, heightCm: null, weightKg: null, quantity: 1 }],
  estimatedPrice: null,
  selectedServiceType: null,
  selectedVehicleType: null,
};

export const useQuoteStore = create<QuoteFormState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep1: (data) => set((state) => ({ ...state, ...data })),
      setStep2: (parcels) => set({ parcels }),
      setStep3: (pricing) => set((state) => ({ ...state, ...pricing })),
      setDistance: (miles) => set({ totalDistanceMiles: miles }),
      resetForm: () => set(initialState),
    }),
    {
      name: 'quote-form-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
