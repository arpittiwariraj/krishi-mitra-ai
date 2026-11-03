import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-leaf-200 bg-white/60 px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-leaf-50 p-3 text-leaf-500">
        <Icon size={24} />
      </div>
      <h3 className="font-semibold text-leaf-950">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-leaf-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
