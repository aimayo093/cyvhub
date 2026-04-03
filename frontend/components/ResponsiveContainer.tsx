import React from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView, Platform } from 'react-native';
import Colors from '@/constants/colors';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  backgroundColor?: string;
  scrollable?: boolean;
}

/**
 * A shared responsive container that enforces CYVhub design standards:
 * - Mobile: Full width with proper internal padding.
 * - Tablet/Desktop: Centered with a maximum width to prevent over-stretching.
 * - Automatically adapts to screen orientation and size changes.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  maxWidth = 800, 
  backgroundColor = Colors.background,
  scrollable = true 
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > maxWidth;

  const content = (
    <View style={[
      styles.internalContent,
      isLargeScreen && { maxWidth, alignSelf: 'center', width: '100%' }
    ]}>
      {children}
    </View>
  );

  if (scrollable) {
    return (
      <ScrollView 
        style={[styles.container, { backgroundColor }]}
        contentContainerStyle={[
          styles.scrollContent,
          isLargeScreen && styles.largeScreenPadding
        ]}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }, styles.nonScrollableContent]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Platform.OS === 'web' ? 40 : 20,
    paddingHorizontal: 16,
  },
  largeScreenPadding: {
    paddingHorizontal: 20,
  },
  internalContent: {
    flex: 1,
  },
  nonScrollableContent: {
    padding: 16,
  }
});
