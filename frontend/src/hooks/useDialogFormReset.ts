import { useEffect, useRef } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

export function useDialogFormReset<T extends FieldValues>(
  form: UseFormReturn<T>,
  open: boolean,
  getValues: () => T,
): void {
  const formRef = useRef(form);
  formRef.current = form;

  const getValuesRef = useRef(getValues);
  getValuesRef.current = getValues;

  useEffect(() => {
    if (open) formRef.current.reset(getValuesRef.current());
  }, [open]);
}
