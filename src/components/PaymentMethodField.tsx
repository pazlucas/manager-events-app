import { View } from 'react-native';

import { PAYMENT_METHODS, PaymentMethod } from '@/api';
import { Chip, Label } from '@/components/ui';

export function PaymentMethodField({
  value,
  onChange,
}: {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Label>Medio de pago</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PAYMENT_METHODS.map(([key, label]) => (
          <Chip key={key} label={label} selected={value === key} onPress={() => onChange(key)} />
        ))}
      </View>
    </View>
  );
}
