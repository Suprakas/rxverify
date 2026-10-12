import React from 'react';
import Skeleton from '../Skeleton/Skeleton.jsx';
import './DataTable.css';

export default function DataTable({
  columns = [],
  data = [],
  keyExtractor = (row, index) => row.id || row._id || index,
  emptyMessage = 'No records found',
  loading = false,
  className = '',
  onRowClick
}) {
  return (
    <div className={`rx-table-container ${className}`.trim()}>
      <table className="rx-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={col.width ? { width: col.width } : undefined}
                className="rx-table__th"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={`loading-${rIdx}`} className="rx-table__tr">
                {columns.map((_, cIdx) => (
                  <td key={`c-${cIdx}`} className="rx-table__td">
                    <Skeleton height="1.25rem" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="rx-table__td rx-table__td--empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rIndex) => (
              <tr
                key={keyExtractor(row, rIndex)}
                className={`rx-table__tr ${onRowClick ? 'rx-table__tr--clickable' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col, cIndex) => {
                  const value = typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : row[col.accessor];

                  return (
                    <td key={cIndex} className="rx-table__td">
                      {col.render ? col.render(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
