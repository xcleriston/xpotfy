import { FormControl, FormLabel, Input, FormErrorMessage, InputProps } from '@chakra-ui/react';
import { Field, FieldProps } from 'formik';

type FormDatePickerProps = InputProps & {
  name: string;
  label?: string;
  isRequired?: boolean;
};

export const FormDatePicker = ({ name, label, isRequired, ...rest }: FormDatePickerProps) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps) => {
        // Converte a data para o formato YYYY-MM-DD para o input
        const value = field.value ? new Date(field.value).toISOString().split('T')[0] : '';
        
        return (
          <FormControl 
            isInvalid={!!(form.errors[name] && form.touched[name])}
            isRequired={isRequired}
            mb={4}
          >
            {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
            <Input
              type="date"
              id={name}
              {...field}
              value={value}
              onChange={(e) => {
                // Converte de volta para Date
                const date = e.target.value ? new Date(e.target.value) : '';
                form.setFieldValue(name, date);
              }}
              {...rest}
            />
            <FormErrorMessage>{form.errors[name] as string}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
};
