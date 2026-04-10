import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { MapPin, Search, ChevronDown, Edit3, X, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { apiClient } from '@/services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AddressData {
  line1: string;
  line2?: string;
  townCity: string;
  county?: string;
  postcode: string;
  latitude: number;
  longitude: number;
  formatted?: string;
}

interface StructuredAddressInputProps {
  label: string;
  onAddressChange: (address: AddressData | null) => void;
  initialValue?: AddressData | null;
}

const StructuredAddressInput: React.FC<StructuredAddressInputProps> = ({
  label,
  onAddressChange,
  initialValue = null
}) => {
  const [postcode, setPostcode] = useState(initialValue?.postcode || '');
  const [addressList, setAddressList] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(initialValue);
  const [isManual, setIsManual] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i;

  const handlePostcodeChange = (text: string) => {
    const val = text.toUpperCase();
    setPostcode(val);
    
    if (val.length >= 5) {
      if (!postcodeRegex.test(val.replace(/\s/g, ''))) {
        setWarning('Invalid UK Postcode format');
      } else {
        setWarning(null);
        lookupPostcode(val);
      }
    } else {
      setWarning(null);
      setAddressList([]);
      setShowDropdown(false);
    }
  };

  const lookupPostcode = async (pc: string) => {
    setLoading(true);
    try {
      const response = await apiClient(`/location/addresses?postcode=${encodeURIComponent(pc)}`);
      if (response.addresses && response.addresses.length > 0) {
        setAddressList(response.addresses);
        setShowDropdown(true);
      } else {
        setWarning('No addresses found for this postcode');
      }
    } catch (error) {
      console.error('[StructuredAddress] Lookup error:', error);
      setWarning('Lookup failed. Try manual entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (addr: AddressData) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedAddress(addr);
    setAddressList([]);
    setShowDropdown(false);
    onAddressChange(addr);
  };

  const toggleManual = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsManual(!isManual);
    if (!selectedAddress) {
      // Create empty template if none selected
      const empty: AddressData = {
        line1: '',
        townCity: '',
        postcode: postcode,
        latitude: 0,
        longitude: 0
      };
      setSelectedAddress(empty);
    }
  };

  const updateField = (field: keyof AddressData, value: string) => {
    if (!selectedAddress) return;
    const updated = { ...selectedAddress, [field]: value };
    setSelectedAddress(updated);
    onAddressChange(updated);
  };

  const reset = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPostcode('');
    setAddressList([]);
    setSelectedAddress(null);
    setIsManual(false);
    setShowDropdown(false);
    setWarning(null);
    onAddressChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* STEP 1: Postcode Input */}
      {!selectedAddress || isManual ? (
        <View style={[styles.inputContainer, warning ? styles.inputWarning : null]}>
          <MapPin size={18} color={warning ? Colors.error : Colors.textMuted} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter Postcode (e.g. CF5 4TF)"
            value={postcode}
            onChangeText={handlePostcodeChange}
            autoCapitalize="characters"
            maxLength={9}
          />
          {loading ? (
            <ActivityIndicator size="small" color={Colors.customerPrimary} />
          ) : postcode.length > 0 ? (
            <TouchableOpacity onPress={reset}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        /* SELECTED STATE */
        <View style={styles.selectedBox}>
          <View style={styles.selectedInfo}>
            <MapPin size={18} color={Colors.customerPrimary} />
            <View style={styles.selectedTextContainer}>
              <Text style={styles.selectedLine1} numberOfLines={1}>{selectedAddress.line1}</Text>
              <Text style={styles.selectedSub}>{selectedAddress.townCity}, {selectedAddress.postcode}</Text>
            </View>
          </View>
          <View style={styles.selectedActions}>
            <TouchableOpacity onPress={() => setIsManual(true)} style={styles.actionIcon}>
              <Edit3 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={styles.actionIcon}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {warning && (
        <View style={styles.warningContainer}>
          <AlertTriangle size={14} color={Colors.error} />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      )}

      {/* STEP 2: Dropdown */}
      {showDropdown && addressList.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={addressList}
            keyExtractor={(_, index) => index.toString()}
            style={styles.dropdownList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => handleSelect(item)}>
                <Text style={styles.dropdownItemText}>{item.line1}</Text>
                <Text style={styles.dropdownItemSub}>{item.townCity}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}

      {/* STEP 3: Manual Fields (Hidden by default) */}
      {isManual && selectedAddress && (
        <View style={styles.manualContainer}>
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Street / Line 1</Text>
              <TextInput 
                style={styles.miniInput} 
                value={selectedAddress.line1} 
                onChangeText={(v) => updateField('line1', v)}
                placeholder="Street Name"
              />
            </View>
          </View>
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Line 2 (Optional)</Text>
              <TextInput 
                style={styles.miniInput} 
                value={selectedAddress.line2} 
                onChangeText={(v) => updateField('line2', v)}
                placeholder="Unit, Suite, etc."
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Town / City</Text>
              <TextInput 
                style={styles.miniInput} 
                value={selectedAddress.townCity} 
                onChangeText={(v) => updateField('townCity', v)}
                placeholder="City"
              />
            </View>
          </View>
          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>County (Optional)</Text>
              <TextInput 
                style={styles.miniInput} 
                value={selectedAddress.county} 
                onChangeText={(v) => updateField('county', v)}
                placeholder="County"
              />
            </View>
          </View>
          <TouchableOpacity onPress={() => setIsManual(false)} style={styles.doneBtn}>
            <Text style={styles.doneBtnText}>Confirm Address</Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedAddress && !loading && postcode.length > 0 && !showDropdown && !isManual && (
        <TouchableOpacity onPress={toggleManual} style={styles.manualLink}>
          <Text style={styles.manualLinkText}>Enter address manually</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default StructuredAddressInput;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 100,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 54,
  },
  inputWarning: {
    borderColor: Colors.error + '40',
    backgroundColor: Colors.error + '08',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownList: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dropdownItemSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  selectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  selectedLine1: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  selectedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualContainer: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 4,
    marginLeft: 2,
  },
  miniInput: {
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
  },
  manualLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
  },
  manualLinkText: {
    fontSize: 13,
    color: Colors.customerPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  doneBtn: {
    backgroundColor: Colors.customerPrimary,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  doneBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  }
});
