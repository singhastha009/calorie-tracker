import SettingsForm from "@/components/SettingsForm";

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-5 md:py-8 space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Personalize your goals and how Claude helps.
        </p>
      </div>
      <SettingsForm />
    </div>
  );
}
