import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
};

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
}

export function DataTable<T extends Record<string, any>>({ data, columns, keyField }: DataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i}>{col.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(row => (
          <TableRow key={row[keyField]}>
            {columns.map((col, i) => (
              <TableCell key={i}>
                {typeof col.accessor === 'function' ? col.accessor(row) : row[col.accessor]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
