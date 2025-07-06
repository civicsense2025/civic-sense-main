'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, FileText, Users, AlertCircle } from 'lucide-react';

interface CongressionalBillsListProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export function CongressionalBillsList({ searchParams }: CongressionalBillsListProps) {
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    fetchBills();
  }, [searchParams]);

  async function fetchBills() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value) {
          params.set(key, String(value));
        }
      });

      const response = await fetch(`/api/congressional/bills?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch bills');
      }

      setBills(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bills.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No bills found matching your criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bills.map((bill) => (
        <Link key={bill.id} href={`/congress/bills/${bill.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2 pr-2">
                    {bill.short_title || bill.title}
                  </CardTitle>
                  <CardDescription>
                    <span className="font-medium">
                      {bill.bill_type.toUpperCase()} {bill.bill_number}
                    </span>
                    {' • '}
                    <span>{bill.congress_number}th Congress</span>
                  </CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              {/* Sponsor Info */}
              {bill.primary_sponsor && (
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    {bill.primary_sponsor.official_photo_url ? (
                      <AvatarImage 
                        src={bill.primary_sponsor.official_photo_url} 
                        alt={bill.primary_sponsor.display_name} 
                      />
                    ) : (
                      <AvatarFallback>
                        {bill.primary_sponsor.display_name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {bill.primary_sponsor.display_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {bill.primary_sponsor.party_affiliation} - {bill.primary_sponsor.current_state}
                    </p>
                  </div>
                </div>
              )}

              {/* Bill Analysis Preview */}
              {bill.bill_content_analysis?.[0] && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    CivicSense Analysis
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {bill.bill_content_analysis[0].plain_english_summary}
                  </p>
                  {bill.bill_content_analysis[0].uncomfortable_truths?.length > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {bill.bill_content_analysis[0].uncomfortable_truths.length} uncomfortable truths
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              {/* Status and Last Action */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {bill.current_status}
                  </Badge>
                  <span className="text-gray-600">
                    Last action {formatDistanceToNow(new Date(bill.last_action_date))} ago
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {pagination.hasPrev && (
            <Link
              href={`?page=${pagination.page - 1}`}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          {pagination.hasNext && (
            <Link
              href={`?page=${pagination.page + 1}`}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
} 