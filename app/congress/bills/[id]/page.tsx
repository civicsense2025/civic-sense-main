import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CongressionalBillDetail } from '@/components/congressional/bill-detail';

async function getBill(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/congressional/bills/${id}`, {
    next: { revalidate: 300 } // Revalidate every 5 minutes
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      notFound();
    }
    throw new Error('Failed to fetch bill');
  }
  
  const data = await res.json();
  return data.data;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const bill = await getBill(params.id);
  
  return {
    title: `${bill.short_title || bill.title} | CivicSense`,
    description: bill.bill_content_analysis?.[0]?.plain_english_summary || 
      `Track ${bill.bill_type.toUpperCase()} ${bill.bill_number} from the ${bill.congress_number}th Congress`,
  };
}

export default async function CongressionalBillPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const bill = await getBill(params.id);
  
  return <CongressionalBillDetail bill={bill} />;
} 