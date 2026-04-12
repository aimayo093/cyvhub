import React from 'react';
import { PostcodeAutocomplete } from './PostcodeAutocomplete';
import { PostcodeAutocompleteProps } from '../../types/address.types';

/**
 * Native-optimized Postcode Autocomplete component.
 * Currently uses the shared base with native-specific styles handled internally.
 */
export const PostcodeAutocompleteMobile: React.FC<PostcodeAutocompleteProps> = (props) => {
  return <PostcodeAutocomplete {...props} />;
};
