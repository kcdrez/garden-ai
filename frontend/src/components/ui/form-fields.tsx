import * as React from 'react'
import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type BaseProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  control: Control<TFieldValues>
  name: TName
  label: string
}

type TextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseProps<TFieldValues, TName> & Omit<React.ComponentProps<'input'>, 'name'>

function TextField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label, ...inputProps }: TextFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...inputProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

type TextAreaFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseProps<TFieldValues, TName> & Omit<React.ComponentProps<'textarea'>, 'name'>

function TextAreaField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label, ...textareaProps }: TextAreaFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea {...textareaProps} {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

const selectClass = cn(
  'h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'dark:bg-input/30',
)

type NativeSelectFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = BaseProps<TFieldValues, TName> & {
  children: React.ReactNode
  optional?: boolean
  className?: string
}

function NativeSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  children,
  optional = false,
  className,
}: NativeSelectFieldProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <select
              value={optional ? (field.value ?? '') : field.value}
              onChange={(e) =>
                optional
                  ? field.onChange(e.target.value || undefined)
                  : field.onChange(e.target.value)
              }
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
              className={cn(selectClass, className)}
            >
              {children}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export { TextField, TextAreaField, NativeSelectField }
