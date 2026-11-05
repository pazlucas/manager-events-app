import { View } from 'react-native';

import { inputStyle, Label } from '@/components/ui';

/** Web: selector de fecha nativo del navegador. `value` es AAAA-MM-DD, o '' si está vacío. */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, fontFamily: 'inherit', borderStyle: 'solid' }}
      />
    </View>
  );
}
