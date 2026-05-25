import PlanGrid from "@/components/PlanGrid";

export default function PlanPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-5 md:py-8 space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Weekly meal plan
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Jot down what you'd like to eat each day. Auto-saves as you type.
        </p>
      </div>
      <PlanGrid />
    </div>
  );
}
