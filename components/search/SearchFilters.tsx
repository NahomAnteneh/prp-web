import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
}

const typeOptions = [
  { value: 'projects', label: 'Projects' },
  { value: 'repositories', label: 'Repositories' },
  { value: 'groups', label: 'Groups' },
  { value: 'users', label: 'Users' },
  { value: 'students', label: 'Students' },
  { value: 'advisors', label: 'Advisors' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'ARCHIVED', label: 'Archived' },
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
}: SearchFiltersProps) {
  const safeStatus = status || 'all';
  const safeRole = role || 'all';
  
  const handleStatusChange = (value: string) => {
    if (setStatus) {
      setStatus(value === 'all' ? '' : value);
    }
  };
  
  const handleRoleChange = (value: string) => {
    if (setRole) {
      setRole(value === 'all' ? '' : value);
    }
  };
  
  return (
    <div className={cn('flex flex-wrap gap-2 items-center', className)}>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-40">{typeOptions.find(opt => opt.value === type)?.label}</SelectTrigger>
        <SelectContent>
          {typeOptions.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {setStatus && (
        <Select value={safeStatus} onValueChange={handleStatusChange}>
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
        <Input value={dept} onChange={e => setDept(e.target.value)} placeholder="Department" className="w-32" />
      )}
      
      {setBatch && (
        <Input value={batch} onChange={e => setBatch(e.target.value)} placeholder="Batch" className="w-24" />
      )}
      
      {setRole && (
        <Select value={safeRole} onValueChange={handleRoleChange}>
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