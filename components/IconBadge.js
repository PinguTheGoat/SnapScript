import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function IconBadge({ backgroundColor, iconColor, iconName, size = 17 }) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Ionicons name={iconName} size={size} color={iconColor} />
    </View>
  );
}
