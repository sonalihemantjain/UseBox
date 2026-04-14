import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Loader2 } from "lucide-react";
import { useLabs, type Lab } from "@/hooks/useLabs";
import { LabCard } from "@/components/lab/LabCard";
import { LabDetail } from "@/components/lab/LabDetail";


export default function Lab() {
  const { labs, loading, generating, generateLab, toggleStepComplete, deleteLab } = useLabs();
  const [selected, setSelected] = useState<Lab | null>(null);

  const currentSelected = selected ? labs.find(l => l.id === selected.id) || null : null;

  if (currentSelected) {
    return (
      <LabDetail
        lab={currentSelected}
        onBack={() => setSelected(null)}
        onToggleStep={toggleStepComplete}
      />
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">My Labs</h1>
            <p className="text-muted-foreground text-lg">
              Hands-on practical labs to build real-world skills
            </p>
          </div>
          
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : labs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 text-muted-foreground"
          >
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-2">No labs yet</p>
            <p className="text-sm">Create a lab to start practicing hands-on skills</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {labs.map((lab, i) => (
              <LabCard
                key={lab.id}
                lab={lab}
                index={i}
                onSelect={setSelected}
                onDelete={deleteLab}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
