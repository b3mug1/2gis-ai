"use client";

import { motion } from "framer-motion";
import { Settings, Moon, Trash2, LogOut, ChevronRight, Bell, Globe } from "lucide-react";
import { ThemeSwitcher } from "@/components/shared/ThemeSwitcher";
import { useAuth } from "@/features/auth/AuthContext";
import { useRouter } from "next/navigation";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/components/ui/toaster";
import { useState } from "react";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      </div>
      <div className="divide-y divide-[hsl(var(--border))]">{children}</div>
    </div>
  );
}

function SettingsRow({ icon: Icon, label, description, action }: {
  icon: React.ElementType;
  label: string;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="w-9 h-9 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();
  const [clearConfirm, setClearConfirm] = useState(false);

  async function handleLogout() {
    await logout();
    toast.info("Signed out");
    router.replace("/login");
  }

  function clearCache() {
    queryClient.clear();
    toast.success("Cache cleared");
    setClearConfirm(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Settings className="w-6 h-6 text-brand-500" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">Customize your experience</p>
      </motion.div>

      <div className="space-y-5">
        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SettingsSection title="Appearance">
            <SettingsRow
              icon={Moon}
              label="Theme"
              description="Choose how City Guide AI looks"
              action={<ThemeSwitcher />}
            />
          </SettingsSection>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SettingsSection title="Preferences">
            <SettingsRow
              icon={Globe}
              label="Language"
              description="Interface language"
              action={
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  English <ChevronRight className="w-3.5 h-3.5" />
                </span>
              }
            />
            <SettingsRow
              icon={Bell}
              label="Notifications"
              description="Search result notifications"
              action={
                <button className="relative w-10 h-5 rounded-full bg-brand-500 transition-colors">
                  <span className="absolute right-1 top-1 w-3 h-3 rounded-full bg-white shadow-sm" />
                </button>
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Data */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SettingsSection title="Data & Privacy">
            <SettingsRow
              icon={Trash2}
              label="Clear local cache"
              description="Removes cached queries from this device"
              action={
                clearConfirm ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setClearConfirm(false)} className="text-xs text-muted-foreground">Cancel</button>
                    <button onClick={clearCache} className="text-xs font-medium text-destructive">Confirm</button>
                  </div>
                ) : (
                  <button onClick={() => setClearConfirm(true)} className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors">
                    Clear
                  </button>
                )
              }
            />
          </SettingsSection>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SettingsSection title="Account">
            <SettingsRow
              icon={LogOut}
              label="Sign out"
              description="End your current session"
              action={
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-destructive hover:underline"
                >
                  Sign out
                </button>
              }
            />
          </SettingsSection>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground pt-4">
          City Guide AI v1.0.0 · Powered by Gemini + 2GIS
        </p>
      </div>
    </div>
  );
}
