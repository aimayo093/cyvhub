import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Platform,
  Pressable
} from 'react-native';
import { MapPin, Search, X, ChevronDown, CheckCircle2 } from 'lucide-react-native';
import Colors from '../../constants/colors';
import { apiClient } from '../../services/api';
import { AddressResult, PostcodeAutocompleteProps } from '../../types/address.types';

export const PostcodeAutocomplete: React.FC<PostcodeAutocompleteProps> = ({
  label,
  placeholder = "Enter postcode or address",
  initialValue,
  onAddressSelect,
  error,
  icon
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Partial manual address state (if no getAddress results)
  const [manualLine1, setManualLine1] = useState('');

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    if (initialValue) {
      if (typeof initialValue === 'string') {
        setQuery(initialValue);
      } else {
        setSelectedAddress(initialValue);
        setQuery(initialValue.postcode);
      }
    }
  }, [initialValue]);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    setManualMode(false);
    
    if (text.length < 3) {
      setSuggestions([]);
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setShowDropdown(true);
      
      try {
        // Detect if it looks like a full postcode (UK format)
        const isPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(text.replace(/\s/g, ''));
        
        if (isPostcode) {
          // Resolve full postcode to address list
          const response = await apiClient(`/location/addresses?postcode=${encodeURIComponent(text)}`);
          if (response && response.addresses) {
            setAddresses(response.addresses);
            setSuggestions([]);
          }
        } else {
          // General autocomplete
          const response = await apiClient(`/location/autocomplete?query=${encodeURIComponent(text)}`);
          if (response && response.suggestions) {
            setSuggestions(response.suggestions);
            setAddresses([]);
          }
        }
      } catch (err) {
        console.error('[PostcodeAutocomplete] Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleSelectSuggestion = async (suggestion: any) => {
    setLoading(true);
    setSuggestions([]);
    setShowDropdown(false);
    
    try {
      const response = await apiClient(`/location/addresses?postcode=${encodeURIComponent(suggestion.description.split(',').pop().trim())}`);
      if (response && response.addresses) {
        setAddresses(response.addresses);
        setShowDropdown(true); // Show the house selection dropdown
      }
    } catch (err) {
      console.error('[PostcodeAutocomplete] Detail failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: AddressResult) => {
    if (address.id.startsWith('manual-')) {
      setManualMode(true);
      setSelectedAddress(address);
      setAddresses([]);
      setShowDropdown(false);
      return;
    }

    setSelectedAddress(address);
    setQuery(address.postcode);
    setSuggestions([]);
    setAddresses([]);
    setShowDropdown(false);
    onAddressSelect(address);
  };

  const clearSelection = () => {
    setSelectedAddress(null);
    setQuery('');
    setSuggestions([]);
    setAddresses([]);
    setManualMode(false);
    setManualLine1('');
  };

  const handleManualSubmit = () => {
    if (selectedAddress && manualLine1) {
      const finalAddress = { ...selectedAddress, line1: manualLine1 };
      onAddressSelect(finalAddress);
      setManualMode(false);
      setQuery(finalAddress.postcode);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {icon || <Search size={18} color={Colors.textMuted} />}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={selectedAddress && !manualMode ? `${selectedAddress.line1 ? selectedAddress.line1 + ', ' : ''}${selectedAddress.postcode}` : query}
          onChangeText={handleSearch}
          onFocus={() => (suggestions.length > 0 || addresses.length > 0) && setShowDropdown(true)}
        />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : query.length > 0 || selectedAddress ? (
          <TouchableOpacity onPress={clearSelection}>
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <ChevronDown size={18} color={Colors.textMuted} />
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showDropdown && (suggestions.length > 0 || addresses.length > 0) && (
        <View style={styles.dropdown}>
          <FlatList
            data={suggestions.length > 0 ? suggestions : addresses}
            keyExtractor={(item) => item.id || item.description}
            renderItem={({ item }) => (
              <Pressable 
                style={({ hovered }) => [
                  styles.suggestionItem,
                  hovered && styles.suggestionItemHover
                ]}
                onPress={() => suggestions.length > 0 ? handleSelectSuggestion(item) : handleSelectAddress(item)}
              >
                <MapPin size={16} color={Colors.textSecondary} style={styles.itemIcon} />
                <Text style={styles.itemText} numberOfLines={2}>
                  {item.description || item.formatted || item.line1 || `Postcode: ${item.postcode}`}
                </Text>
              </Pressable>
            )}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
          />
        </View>
      )}

      {manualMode && selectedAddress && (
        <View style={styles.manualEntryContainer}>
          <Text style={styles.manualInstruction}>Address found for {selectedAddress.postcode}. Please enter street name / house number:</Text>
          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="e.g. 44 Addison Road"
              value={manualLine1}
              onChangeText={setManualLine1}
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.manualBtn, !manualLine1 && { opacity: 0.5 }]} 
              onPress={handleManualSubmit}
              disabled={!manualLine1}
            >
              <CheckCircle2 size={18} color="#FFF" />
              <Text style={styles.manualBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.autoFillSummary}>
            <Text style={styles.autoFillText}>City: {selectedAddress.townCity}</Text>
            {selectedAddress.county && <Text style={styles.autoFillText}>County: {selectedAddress.county}</Text>}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.navy,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Platform.OS === 'web' ? 12 : 10,
    paddingHorizontal: 12,
    height: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      web: {
        transitionProperty: 'all',
        transitionDuration: '200ms',
        outlineStyle: 'none',
      },
      ios: {
        shadowColor: Colors.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      }
    }),
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 10,
    fontSize: 15,
    color: Colors.text,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    })
  },
  inputError: {
    borderColor: Colors.danger,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 300,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  list: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  suggestionItemHover: {
    backgroundColor: Colors.borderLight,
  },
  itemIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  manualEntryContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: Colors.info + '08',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.info + '20',
  },
  manualInstruction: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
  },
  manualInput: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  manualBtn: {
    backgroundColor: Colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  manualBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  autoFillSummary: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  autoFillText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  }
});
