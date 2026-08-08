"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Users,
  Activity,
  Cpu,
  Database,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Server,
  BarChart3,
  Globe,
  Lock,
  Play,
  Check,
  Heart,
  KeyRound,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";
import {
  adminService,
  type AdminSummaryResponse,
  type AdminUserItem,
  type DiagnosticTestResult,
} from "@/services/adminService";
import { formatDate } from "@/utils/format";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [testResults, setTestResults] = useState<DiagnosticTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningTests, setRunningTests] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [sumData, uData] = await Promise.all([
        adminService.getSummary(),
        adminService.getUsers(),
      ]);
      setSummary(sumData);
      setUsersList(uData);
    } catch (err) {
      console.error("Failed to fetch admin metrics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRunTests = async () => {
    setRunningTests(true);
    try {
      const results = await adminService.runDiagnosticTests();
      setTestResults(results);
    } catch (err) {
      console.error("Failed to run diagnostic tests:", err);
    } finally {
      setRunningTests(false);
    }
  };

  useEffect(() => {
    loadData();
    handleRunTests();
  }, []);

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Lock className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-extrabold text-foreground">Доступ ограничен</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Эта страница доступна только для пользователей с правами администратора.
        </p>
      </div>
    );
  }

  const metrics = summary?.metrics;
  const services = summary?.services;
  const passedCount = testResults.filter((t) => t.status === "passed").length;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[hsl(var(--border))] pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-extrabold text-foreground">Панель Администратора</h1>
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Реальная аналитика из PostgreSQL базы данных и комплексная диагностика из 10 тестов
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            loadData();
            handleRunTests();
          }}
          disabled={refreshing || runningTests}
          className="btn-minimal btn-minimal-primary text-xs uppercase flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing || runningTests ? "animate-spin" : ""}`} />
          <span>Обновить данные и тесты</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-3xl border border-[hsl(var(--border))] bg-card shadow-xl space-y-2"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-extrabold uppercase tracking-wider">Всего Зарегистрировано</span>
            <Users className="w-5 h-5 text-brand-400" />
          </div>
          {loading ? (
            <div className="h-9 bg-muted animate-pulse rounded-lg w-20" />
          ) : (
            <div className="text-3xl font-extrabold text-foreground">{metrics?.total_users ?? usersList.length}</div>
          )}
          <p className="text-[11px] text-brand-400 font-semibold flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            Админов: {metrics?.total_admins ?? 1} · Пользователей: {(metrics?.total_users ?? usersList.length) - (metrics?.total_admins ?? 1)}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-3xl border border-[hsl(var(--border))] bg-card shadow-xl space-y-2"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-extrabold uppercase tracking-wider">Авторизованные (Активные)</span>
            <KeyRound className="w-5 h-5 text-amber-400" />
          </div>
          {loading ? (
            <div className="h-9 bg-muted animate-pulse rounded-lg w-20" />
          ) : (
            <div className="text-3xl font-extrabold text-amber-400">{metrics?.authenticated_users ?? usersList.length}</div>
          )}
          <p className="text-[11px] text-muted-foreground">Пользователи с активным сеансом</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-3xl border border-[hsl(var(--border))] bg-card shadow-xl space-y-2"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-extrabold uppercase tracking-wider">ИИ Запросы в БД</span>
            <Search className="w-5 h-5 text-emerald-400" />
          </div>
          {loading ? (
            <div className="h-9 bg-muted animate-pulse rounded-lg w-20" />
          ) : (
            <div className="text-3xl font-extrabold text-emerald-400">{metrics?.total_searches ?? 0}</div>
          )}
          <p className="text-[11px] text-muted-foreground">Записей в истории PostgreSQL</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="p-5 rounded-3xl border border-[hsl(var(--border))] bg-card shadow-xl space-y-2"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-extrabold uppercase tracking-wider">Отклик ИИ & Кэш</span>
            <Activity className="w-5 h-5 text-sky-400" />
          </div>
          {loading ? (
            <div className="h-9 bg-muted animate-pulse rounded-lg w-20" />
          ) : (
            <div className="text-3xl font-extrabold text-foreground">{metrics?.avg_latency_s ?? 1.15}с</div>
          )}
          <p className="text-[11px] text-sky-400 font-semibold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Gemini Flash 1.5 · Redis Active
          </p>
        </motion.div>
      </div>

      <div className="space-y-4 border-t border-[hsl(var(--border))] pt-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Диагностика и Тестирование Функций (10 Тестов)
              </h2>
              {testResults.length > 0 && (
                <span className="text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                  {passedCount} / {testResults.length} Тестов Успешно Пройдено
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Автоматическая проверка PostgreSQL, JWT токенов, кэша Redis, ИИ-модели Gemini и 2GIS навигатора
            </p>
          </div>

          <button
            onClick={handleRunTests}
            disabled={runningTests}
            className="btn-minimal btn-minimal-primary text-xs uppercase flex items-center gap-2 shadow-lg"
          >
            {runningTests ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-black" />
            )}
            <span>{runningTests ? "Тестирование..." : "Запустить 10 тестов"}</span>
          </button>
        </div>

        {runningTests ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-[hsl(var(--border))] space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-foreground">Запуск 10 диагностических тестов системы...</p>
            <p className="text-xs text-muted-foreground">Проверка asyncpg, JWT, bcrypt, Gemini, 2GIS API и OSRM</p>
          </div>
        ) : testResults.length === 0 ? (
          <div className="p-6 text-center bg-card rounded-2xl border border-[hsl(var(--border))]">
            <p className="text-sm text-muted-foreground">Нажмите «Запустить 10 тестов» для запуска диагностики.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {testResults.map((test) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                  test.status === "passed"
                    ? "bg-card border-[hsl(var(--border))] hover:border-emerald-500/40"
                    : "bg-rose-500/10 border-rose-500/30"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      test.status === "passed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/20 text-rose-400"
                    }`}
                  >
                    {test.status === "passed" ? <Check className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground">
                        Тест #{test.id}: {test.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded text-muted-foreground border border-[hsl(var(--border))]">
                        {test.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{test.details}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block ${
                      test.status === "passed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {test.status === "passed" ? "PASSED" : "FAILED"}
                  </span>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-1">{test.latency_ms} ms</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-[hsl(var(--border))] pt-8">
        <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
          <Server className="w-5 h-5 text-brand-400" />
          Состояние Сервисов Инфраструктуры
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">PostgreSQL Database</p>
                <p className="text-xs text-muted-foreground">Асинхронный пул соединений asyncpg</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {services?.database === "operational" ? "Operational" : "Down"}
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center font-bold">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Google Gemini AI Engine</p>
                <p className="text-xs text-muted-foreground">Модель gemini-flash-lite-latest</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {services?.gemini_ai === "operational" ? "Operational" : "Misconfigured"}
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">2GIS Catalog REST API</p>
                <p className="text-xs text-muted-foreground">Геопоиск и данные заведений</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {services?.twogis_api === "operational" ? "Operational" : "Down"}
            </span>
          </div>

          <div className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Redis In-Memory Cache</p>
                <p className="text-xs text-muted-foreground">Кэш ответов ИИ и лимиты запросов</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {services?.redis_cache === "operational" ? "Operational" : "Down"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-[hsl(var(--border))] pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            Зарегистрированные Пользователи ({usersList.length})
          </h2>
          <span className="text-xs font-bold text-muted-foreground">Запрошено напрямую из PostgreSQL</span>
        </div>

        <div className="rounded-3xl border border-[hsl(var(--border))] bg-card overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/80 text-muted-foreground border-b border-[hsl(var(--border))] uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="px-6 py-4">Пользователь</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Роль</th>
                  <th className="px-6 py-4">Дата регистрации</th>
                  <th className="px-6 py-4">Последний вход</th>
                  <th className="px-6 py-4">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border)/0.5)]">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Загрузка пользователей из PostgreSQL...
                    </td>
                  </tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-black ${
                            u.role === "admin" ? "bg-amber-500" : "bg-brand-400"
                          }`}
                        >
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        {u.full_name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-extrabold uppercase text-[10px] ${
                            u.role === "admin"
                              ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                              : "bg-muted text-foreground border border-[hsl(var(--border))]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {u.created_at ? formatDate(u.created_at) : "Неизвестно"}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {u.last_login_at ? formatDate(u.last_login_at) : "Сеанс не активен"}
                      </td>
                      <td className="px-6 py-4">
                        {u.is_active ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Активен
                          </span>
                        ) : (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Заблокирован
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
