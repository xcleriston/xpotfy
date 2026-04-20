import { FormControl, FormLabel, Input, FormErrorMessage, InputProps } from '@chakra-ui/react';
import { Field, FieldProps } from 'formik';

type FormInputProps = InputProps & {
  name: string;
  label?: string;
  isRequired?: boolean;
};

export const FormInput = ({ name, label, isRequired, ...rest }: FormInputProps) => {
  return (
    <Field name={name}>
      {({ field, form }: FieldProps) => (
        <FormControl 
          isInvalid={!!(form.errors[name] && form.touched[name])}
          isRequired={isRequired}
          mb={4}
        >
          {label && <FormLabel htmlFor={name}>{label}</FormLabel>}
          <Input
            {...field}
            id={name}
            {...rest}
          />
          <FormErrorMessage>{form.errors[name] as string}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
};
