export interface AddressResult {
  id: string;
  line1: string;
  line2?: string;
  townCity: string;
  county?: string;
  postcode: string;
  latitude: number;
  longitude: number;
  formatted?: string;
}

export interface PostcodeAutocompleteProps {
  label?: string;
  placeholder?: string;
  initialValue?: string | AddressResult;
  onAddressSelect: (address: AddressResult) => void;
  error?: string;
  icon?: React.ReactNode;
}
