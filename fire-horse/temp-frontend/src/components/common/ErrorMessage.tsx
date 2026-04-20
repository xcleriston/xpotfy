import { Alert, AlertIcon, AlertTitle, AlertDescription, CloseButton, Box } from '@chakra-ui/react';

type ErrorMessageProps = {
  title?: string;
  message: string;
  onClose?: () => void;
  status?: 'error' | 'warning' | 'info' | 'success';
};

export const ErrorMessage = ({
  title = 'Erro',
  message,
  onClose,
  status = 'error',
}: ErrorMessageProps) => {
  return (
    <Alert status={status} mb={4} borderRadius="md" variant="left-accent">
      <AlertIcon />
      <Box flex="1">
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription display="block">{message}</AlertDescription>
      </Box>
      {onClose && (
        <CloseButton
          position="absolute"
          right="8px"
          top="8px"
          onClick={onClose}
        />
      )}
    </Alert>
  );
};
