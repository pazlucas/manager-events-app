import { useEffect, useState } from 'react';

import { Field } from '@/components/ui';
import { formatDate, parseDate } from '@/format';

/** iOS / Android: la fecha se escribe como DD/MM/AAAA. `value` es AAAA-MM-DD, o '' si no es válida. */
export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (iso: string) => void }) {
  const [text, setText] = useState(formatDate(value));

  // Solo se pisa el texto cuando el valor cambia desde afuera (por ejemplo, al cargar el registro).
  useEffect(() => {
    if (parseDate(text) !== value) setText(formatDate(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <Field
      label={label}
      value={text}
      placeholder="DD/MM/AAAA"
      keyboardType="numbers-and-punctuation"
      maxLength={10}
      onChangeText={(t) => {
        setText(t);
        onChange(parseDate(t));
      }}
    />
  );
}
