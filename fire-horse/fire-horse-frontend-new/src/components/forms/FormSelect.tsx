import { FormControl, FormLabel, Select, FormErrorMessage, SelectProps } from '@chakra-ui/react';
import { Field, FieldProps } from 'formik';

type Option = {
  value: string | number;
  label: string;
};

type FormSelectProps = SelectProps & {
  name: string;
  label?: string;
  options: Option[];
  isRequired?: boolean;
};

export const FormSelect = ({ 
  name, 
  label, 
  options, 
  isRequired, 
  placeholder = 'Selecione uma opção',
  ...rest 
}: FormSelectProps) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps) => (
        <FormControl 
          isInvalid={!!(form.errors[name] && form.touched[name])}
          isRequired={isRequired}
          mb={4}
        >
          {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
          <Select
            {...field}
            id={name}
            placeholder={placeholder}
            {...rest}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FormErrorMessage>{form.errors[name] as string}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
};
