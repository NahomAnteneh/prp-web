import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SearchType = 'projects' | 'repositories' | 'groups' | 'users' | 'students' | 'advisors';

interface SearchFiltersProps {
  type: SearchType;
  setType: (type: SearchType) => void;
  status?: string;
  setStatus?: (status: string) => void;
  dept?: string;
  setDept?: (dept: string) => void;
  batch?: string;
  setBatch?: (batch: string) => void;
  role?: string;
  setRole?: (role: string) => void;
  className?: string;
  disabled?: boolean;
}


const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const departmentOptions = [
  { value: 'all', label: 'All Departments' },
  { value: 'CSE', label: 'Computer Science' },
  { value: 'ECE', label: 'Electronics' },
  { value: 'ME', label: 'Mechanical' },
  { value: 'CE', label: 'Civil' },
  { value: 'CHE', label: 'Chemical' },
];

const batchOptions = [
  { value: 'all', label: 'All Batches' },
  { value: '2020', label: '2020' },
  { value: '2021', label: '2021' },
  { value: '2022', label: '2022' },
  { value: '2023', label: '2023' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
];

export function SearchFilters({
  type,
  setType,
  status,
  setStatus,
  dept,
  setDept,
  batch,
  setBatch,
  role,
  setRole,
  className,
  disabled = false,
}: SearchFiltersProps) {
  const safeStatus = status || 'all';
  const safeDept = dept || 'all';
  const safeBatch = batch || 'all';
  const safeRole = role || 'all';
  
  const handleStatusChange = (value: string) => {
    if (setStatus) {
      setStatus(value === 'all' ? '' : value);
    }
  };
  
  const handleDeptChange = (value: string) => {
    if (setDept) {
      setDept(value === 'all' ? '' : value);
    }
  };
  
  const handleBatchChange = (value: string) => {
    if (setBatch) {
      setBatch(value === 'all' ? '' : value);
    }
  };
  
  const handleRoleChange = (value: string) => {
    if (setRole) {
      setRole(value === 'all' ? '' : value);
    }
  };
  
  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      {/* <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-40">{typeOptions.find(opt => opt.value === type)?.label}</SelectTrigger>
        <SelectContent>
          {typeOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select> */}
      
      {setStatus && (
        <Select value={safeStatus} onValueChange={handleStatusChange} disabled={disabled}>
          <SelectTrigger className="w-36">
            {statusOptions.find(opt => opt.value === safeStatus)?.label || 'All Statuses'}
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {setDept && (
        <Select value={safeDept} onValueChange={handleDeptChange} disabled={disabled}>
          <SelectTrigger className="w-36">
            {departmentOptions.find(opt => opt.value === safeDept)?.label || 'All Departments'}
          </SelectTrigger>
          <SelectContent>
            {departmentOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {setBatch && (
        <Select value={safeBatch} onValueChange={handleBatchChange} disabled={disabled}>
          <SelectTrigger className="w-28">
            {batchOptions.find(opt => opt.value === safeBatch)?.label || 'All Batches'}
          </SelectTrigger>
          <SelectContent>
            {batchOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {setRole && (
        <Select value={safeRole} onValueChange={handleRoleChange} disabled={disabled}>
          <SelectTrigger className="w-32">
            {safeRole === 'all' 
              ? 'All Roles' 
              : safeRole.charAt(0).toUpperCase() + safeRole.slice(1).toLowerCase()}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="ADVISOR">Advisor</SelectItem>
            <SelectItem value="EVALUATOR">Evaluator</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}