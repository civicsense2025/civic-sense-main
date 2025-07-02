'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Filter, RotateCcw } from 'lucide-react';

export function CongressionalBillsFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/congress/bills?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push('/congress/bills');
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Congress Number */}
        <div>
          <Label htmlFor="congress">Congress</Label>
          <Select
            value={searchParams.get('congress') || ''}
            onValueChange={(value) => updateFilter('congress', value || null)}
          >
            <SelectTrigger id="congress">
              <SelectValue placeholder="All Congresses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Congresses</SelectItem>
              <SelectItem value="118">118th (2023-2025)</SelectItem>
              <SelectItem value="117">117th (2021-2023)</SelectItem>
              <SelectItem value="116">116th (2019-2021)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bill Type */}
        <div>
          <Label htmlFor="billType">Bill Type</Label>
          <Select
            value={searchParams.get('billType') || ''}
            onValueChange={(value) => updateFilter('billType', value || null)}
          >
            <SelectTrigger id="billType">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="hr">House Bill (H.R.)</SelectItem>
              <SelectItem value="s">Senate Bill (S.)</SelectItem>
              <SelectItem value="hjres">House Joint Resolution</SelectItem>
              <SelectItem value="sjres">Senate Joint Resolution</SelectItem>
              <SelectItem value="hconres">House Concurrent Resolution</SelectItem>
              <SelectItem value="sconres">Senate Concurrent Resolution</SelectItem>
              <SelectItem value="hres">House Resolution</SelectItem>
              <SelectItem value="sres">Senate Resolution</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={searchParams.get('status') || ''}
            onValueChange={(value) => updateFilter('status', value || null)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Status</SelectItem>
              <SelectItem value="introduced">Introduced</SelectItem>
              <SelectItem value="committee">In Committee</SelectItem>
              <SelectItem value="passed">Passed One Chamber</SelectItem>
              <SelectItem value="enrolled">Passed Both Chambers</SelectItem>
              <SelectItem value="law">Became Law</SelectItem>
              <SelectItem value="vetoed">Vetoed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Has Analysis Filter */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="hasAnalysis"
            checked={searchParams.get('hasAnalysis') === 'true'}
            onCheckedChange={(checked) => 
              updateFilter('hasAnalysis', checked ? 'true' : null)
            }
          />
          <Label 
            htmlFor="hasAnalysis" 
            className="text-sm font-normal cursor-pointer"
          >
            Only show bills with CivicSense analysis
          </Label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
} 