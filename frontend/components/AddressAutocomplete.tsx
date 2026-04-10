import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Search, MapPin, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

interface AddressAutocompleteProps {
  placeholder: string;
  onAddressSelect: (address: any) => void;
  initialValue?: string;
  icon?: React.ReactNode;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  placeholder,
  onAddressSelect,
  initialValue = '',
  icon,
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (initialValue) setQuery(initialValue);
  }, [initialValue]);

  const fetchSuggestions = async (text: string) => {
    setQuery(text);
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // First, check if it's a full postcode
      const isPostcode = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i.test(text.replace(/\s/g, ''));
      
      const endpoint = isPostcode ? `/location/addresses?postcode=${encodeURIComponent(text)}` : `/location/autocomplete?query=${encodeURIComponent(text)}`;
      const response = await apiClient(endpoint);

      if (isPostcode && response.addresses) {
        setSuggestions(response.addresses.map((a: any) => ({
          ...a,
          description: a.formatted || `${a.line1}, ${a.townCity}, ${a.postcode}`
        })));
      } else if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
      
      setShowSuggestions(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error('[AddressAutocomplete] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: any) => {
    setShowSuggestions(false);
    setQuery(item.description || item.line1);
    
    if (item.id && !item.line1) {
      // It's an autocomplete suggestion, need full detail
      setLoading(true);
      try {
        const detail = await apiClient(`/location/resolve?id=${item.id}`);
        onAddressSelect(detail);
      } catch (e) {
        console.error('[AddressAutocomplete] Detail error:', e);
      } finally {
        setLoading(false);
      }
    } else {
      // It's already a full address from postcode lookup
      onAddressSelect(item);
    }
  };

  const clear = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {icon || <Search size={18} color={Colors.textMuted} />}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={fetchSuggestions}
          onFocus={() => query.length >= 3 && setShowSuggestions(true)}
        />
        {loading ? (
          <ActivityIndicator size="small" color={Colors.customerPrimary} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={clear}>
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <Animated.View style={[styles.dropdown, { opacity: dropdownAnim }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id || item.description}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <MapPin size={16} color={Colors.textMuted} style={styles.itemIcon} />
                <Text style={styles.itemText} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    height: '100%',
    marginLeft: 8,
    fontSize: 15,
    color: Colors.text,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 250,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  list: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
