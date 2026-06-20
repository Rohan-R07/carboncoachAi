import AssessmentForm from "@/components/assessment-form";

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-6">
      {/* Main wizard */}
      <main className="flex-grow flex items-center justify-center">
        <AssessmentForm />
      </main>
    </div>
  );
}
