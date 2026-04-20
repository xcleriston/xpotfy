import { Table, Thead, Tbody, Tr, Th, Td, TableContainer, Box, Text, Flex, IconButton, useColorModeValue } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

type Column = {
  key: string;
  header: string;
  accessor: (row: any) => React.ReactNode;
  isNumeric?: boolean;
};

type DataTableProps = {
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick?: (row: any) => void;
};

export const DataTable = ({
  columns,
  data,
  isLoading = false,
  page,
  totalPages,
  onPageChange,
  onRowClick,
}: DataTableProps) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  
  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Carregando...</Text>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Nenhum registro encontrado</Text>
      </Box>
    );
  }

  return (
    <Box>
      <TableContainer borderWidth="1px" borderRadius="md" borderColor={borderColor}>
        <Table variant="simple">
          <Thead>
            <Tr>
              {columns.map((column) => (
                <Th key={column.key} isNumeric={column.isNumeric}>
                  {column.header}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, rowIndex) => (
              <Tr 
                key={rowIndex} 
                _hover={{ bg: hoverBg, cursor: onRowClick ? 'pointer' : 'default' }}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <Td key={`${rowIndex}-${column.key}`} isNumeric={column.isNumeric}>
                    {column.accessor(row)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      
      <Flex justify="space-between" mt={4} align="center">
        <Text fontSize="sm" color="gray.500">
          Página {page} de {totalPages}
        </Text>
        
        <Flex>
          <IconButton
            icon={<FiChevronsLeft />}
            aria-label="Primeira página"
            onClick={() => onPageChange(1)}
            isDisabled={page === 1}
            size="sm"
            mr={1}
          />
          <IconButton
            icon={<FiChevronLeft />}
            aria-label="Página anterior"
            onClick={() => onPageChange(page - 1)}
            isDisabled={page === 1}
            size="sm"
            mr={1}
          />
          <IconButton
            icon={<FiChevronRight />}
            aria-label="Próxima página"
            onClick={() => onPageChange(page + 1)}
            isDisabled={page === totalPages}
            size="sm"
            mr={1}
          />
          <IconButton
            icon={<FiChevronsRight />}
            aria-label="Última página"
            onClick={() => onPageChange(totalPages)}
            isDisabled={page === totalPages}
            size="sm"
          />
        </Flex>
      </Flex>
    </Box>
  );
};
