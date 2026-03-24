import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CreditCard,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function EditProfileScreen() {
  const router = useRouter();
  const { driver, customer, admin, userRole, updateProfile } = useAuth();
  const isDriver = userRole === 'driver';
  const isAdmin = userRole === 'admin';
  const accent = isDriver ? Colors.primary : isAdmin ? Colors.adminPrimary : Colors.customerPrimary;
  const profile = isDriver ? driver : isAdmin ? admin : customer;

  const [firstName, setFirstName] = useState<string>(profile?.firstName ?? '');
  const [lastName, setLastName] = useState<string>(profile?.lastName ?? '');
  const [email, setEmail] = useState<string>(profile?.email ?? '');
  const [phone, setPhone] = useState<string>(profile?.phone ?? '');
  const [address, setAddress] = useState<string>(
    isDriver || isAdmin ? '' : (customer?.defaultAddress ?? '')
  );
  const [city, setCity] = useState<string>(
    isDriver || isAdmin ? '' : (customer?.defaultCity ?? '')
  );
  const [postcode, setPostcode] = useState<string>(
    isDriver || isAdmin ? '' : (customer?.defaultPostcode ?? '')
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = useCallback(() => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      updateProfile(profile?.id || '', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        ...(isDriver || isAdmin ? {} : {
          defaultAddress: address.trim(),
          defaultCity: city.trim(),
          defaultPostcode: postcode.trim(),
        }),
      });

      setIsSaving(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Profile updated successfully
      Alert.alert('Profile Updated', 'Your profile has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 500);
  }, [firstName, lastName, email, phone, address, city, postcode, isDriver, isAdmin, updateProfile, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: Colors.navy },
          headerTintColor: Colors.textInverse,
          headerTitleStyle: { fontWeight: '600' as const },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: accent }]}>
              <Text style={styles.avatarText}>
                {firstName[0] ?? ''}{lastName[0] ?? ''}
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Personal Information</Text>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldRow}>
                <View style={styles.fieldSplit}>
                  <Text style={styles.fieldLabel}>First Name *</Text>
                  <View style={styles.inputRow}>
                    <User size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First name"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="words"
                      testID="edit-firstname"
                    />
                  </View>
                </View>
                <View style={styles.fieldSplit}>
                  <Text style={styles.fieldLabel}>Last Name *</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last name"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="words"
                      testID="edit-lastname"
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Email *</Text>
                <View style={styles.inputRow}>
                  <Mail size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email address"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="edit-email"
                  />
                </View>
              </View>

              <View>
                <Text style={styles.fieldLabel}>Phone *</Text>
                <View style={styles.inputRow}>
                  <Phone size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Phone number"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                    testID="edit-phone"
                  />
                </View>
              </View>
            </View>
          </View>

          {(!isDriver && !isAdmin) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Default Address</Text>
              <View style={styles.fieldGroup}>
                <View>
                  <Text style={styles.fieldLabel}>Street Address</Text>
                  <View style={styles.inputRow}>
                    <MapPin size={16} color={Colors.textMuted} />
                    <TextInput
                      style={styles.input}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Street address"
                      placeholderTextColor={Colors.textMuted}
                      testID="edit-address"
                    />
                  </View>
                </View>
                <View style={styles.fieldRow}>
                  <View style={styles.fieldSplit}>
                    <Text style={styles.fieldLabel}>City</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor={Colors.textMuted}
                      />
                    </View>
                  </View>
                  <View style={[styles.fieldSplit, { flex: 0.6 }]}>
                    <Text style={styles.fieldLabel}>Postcode</Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.input}
                        value={postcode}
                        onChangeText={setPostcode}
                        placeholder="Postcode"
                        placeholderTextColor={Colors.textMuted}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {isDriver && driver && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Driver Details</Text>
              <View style={styles.readOnlyField}>
                <CreditCard size={16} color={Colors.textMuted} />
                <View style={styles.readOnlyContent}>
                  <Text style={styles.readOnlyLabel}>Licence Number</Text>
                  <Text style={styles.readOnlyValue}>{driver.licenceNumber}</Text>
                </View>
              </View>
              <View style={[styles.readOnlyField, { borderBottomWidth: 0 }]}>
                <CreditCard size={16} color={Colors.textMuted} />
                <View style={styles.readOnlyContent}>
                  <Text style={styles.readOnlyLabel}>Driver Number</Text>
                  <Text style={styles.readOnlyValue}>{driver.driverNumber}</Text>
                </View>
              </View>
              <Text style={styles.readOnlyNote}>
                Contact support to update licence or driver details.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: accent }, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
            testID="save-profile"
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 14,
  },
  fieldGroup: {
    gap: 14,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldSplit: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  readOnlyContent: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginTop: 2,
  },
  readOnlyNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 10,
    fontStyle: 'italic',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    height: 56,
    gap: 8,
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
