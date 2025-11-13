'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function AlertBox({
  message,
  type = "success",
  onClose
}: {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
}) {
  const isSuccess = type === "success";
  const colors = isSuccess
    ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
    : "bg-red-50 border border-red-300 text-red-800";

  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className={`fixed bottom-6 right-6 shadow-xl rounded-2xl p-4 flex items-center gap-3 max-w-sm z-50 ${colors}`}
        >
          <Icon className={isSuccess ? "text-emerald-500" : "text-red-500"} size={24} />
          <div className="flex-1 text-left">
            <p className="font-semibold text-base leading-snug">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 text-sm text-neutral-500 hover:text-neutral-700 transition"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}