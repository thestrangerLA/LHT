
import type { Metadata } from 'next';
import { getTourProgram, getAllTourProgramIds } from '@/services/tourProgramService';
import TourProgramClientPage from './client-page';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const ids = await getAllTourProgramIds();
    // Ensure there's at least one param to avoid build errors if the collection is empty.
    if (ids.length === 0) {
      return [{ id: 'default' }];
    }
    return ids;
  } catch (error) {
    console.error("Error fetching static params for tour programs:", error);
    // Return a default param as a fallback to allow the build to succeed.
    return [{ id: 'default' }];
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (params.id === 'default') {
    return { title: 'Tour Program' };
  }
  
  const program = await getTourProgram(params.id);
  
  if (!program) {
    return { title: 'Tour Program Not Found' };
  }

  return {
    title: `Tour: ${program.programName}`,
    description: `Details for tour program: ${program.programName}`,
  };
}

export default async function TourProgramPage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (id === 'default') {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-2xl font-semibold mb-4">Loading Program...</p>
        <p>This is a placeholder page for static export.</p>
      </div>
    );
  }
  
  const program = await getTourProgram(id);

  if (!program) {
    return (
        <div className="flex justify-center items-center h-screen">
            <h1>Tour Program not found</h1>
        </div>
    );
  }

  return <TourProgramClientPage initialProgram={program} />;
}
