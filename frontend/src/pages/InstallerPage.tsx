import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  Database,
  ShieldCheck,
  Server,
  Key,
  ArrowRight,
  RefreshCw,
  Zap,
  Globe,
  User,
  Lock,
  Building,
} from 'lucide-react';
import { installerApi } from '../api';

export default function InstallerPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [dbTested, setDbTested] = useState(false);
  const [dbTestMessage, setDbTestMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  // Step 2 Form
  const [dbDriver, setDbDriver] = useState<'pgsql' | 'mysql'>('mysql');
  const [dbHost, setDbHost] = useState('localhost');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('saas_db');
  const [dbUser, setDbUser] = useState('saas_user');
  const [dbPass, setDbPass] = useState('');

  // Step 3 Form
  const [appName, setAppName] = useState('Commercial SaaS Platform');
  const [appUrl, setAppUrl] = useState(window.location.origin);
  const [adminName, setAdminName] = useState('Super Admin');
  const [adminEmail, setAdminEmail] = useState('admin@saasplatform.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [orgName, setOrgName] = useState('Global Operations Ltd');

  // Query Requirements
  const { data: reqData, isLoading: loadingReq, refetch: refetchReq } = useQuery({
    queryKey: ['installer', 'requirements'],
    queryFn: () => installerApi.requirements().then(r => r.data),
  });

  // Test Database Mutation
  const testDbMutation = useMutation({
    mutationFn: () => installerApi.testDb({
      db_driver: dbDriver,
      db_host: dbHost,
      db_port: parseInt(dbPort),
      db_name: dbName,
      db_user: dbUser,
      db_pass: dbPass,
    }),
    onSuccess: (res) => {
      setDbTested(true);
      setDbTestMessage({ success: true, message: res.data?.message || 'Database Connection Successful!' });
    },
    onError: (err: any) => {
      setDbTested(false);
      setDbTestMessage({
        success: false,
        message: err.response?.data?.message || 'Database connection failed. Check host, port, credentials.',
      });
    },
  });

  // Execute Installation Mutation
  const executeMutation = useMutation({
    mutationFn: () => installerApi.execute({
      app_name: appName,
      app_url: appUrl,
      db_driver: dbDriver,
      db_host: dbHost,
      db_port: parseInt(dbPort),
      db_name: dbName,
      db_user: dbUser,
      db_pass: dbPass,
      admin_name: adminName,
      admin_email: adminEmail,
      admin_password: adminPassword,
      org_name: orgName,
      force: true,
    }),
    onSuccess: (res: any) => {
      setInstalling(false);
      if (res.data?.success) {
        setStep(5);
      } else {
        setInstallError(res.data?.message || 'Installation execution failed.');
      }
    },
    onError: (err: any) => {
      setInstalling(false);
      const msg = typeof err.response?.data === 'string'
        ? err.response.data
        : (err.response?.data?.message || err.message || 'Installation execution failed.');
      setInstallError(msg);
    },
  });

  const handleStartInstallation = () => {
    setInstalling(true);
    setInstallError(null);
    executeMutation.mutate();
  };

  const allReqMet = reqData?.all_met;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Commercial Web Platform Installer</h1>
              <p className="text-xs text-violet-200 mt-0.5">Automated cPanel & Server Installation Wizard</p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10 text-xs font-semibold">
            {[
              { num: 1, label: 'Requirements' },
              { num: 2, label: 'Database' },
              { num: 3, label: 'Admin Setup' },
              { num: 4, label: 'Install' },
              { num: 5, label: 'Complete' },
            ].map(s => (
              <div
                key={s.num}
                className={`flex items-center gap-2 ${
                  step === s.num ? 'text-white' : step > s.num ? 'text-emerald-300' : 'text-violet-300 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    step === s.num
                      ? 'bg-white text-violet-700 shadow-md'
                      : step > s.num
                      ? 'bg-emerald-400 text-slate-900'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-6">
          {/* STEP 1: SERVER REQUIREMENTS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-violet-600" /> Server Requirements & Storage Permissions
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Checking PHP version, required extensions, and writable folders.
                </p>
              </div>

              {loadingReq ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin text-violet-600" /> Inspecting environment...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* PHP Version */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-800">PHP 8.2.0 or Higher</span>
                    <span className="flex items-center gap-1.5 font-bold">
                      {reqData?.php?.passed ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Passed ({reqData.php.version})
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Failed ({reqData?.php?.version})
                        </span>
                      )}
                    </span>
                  </div>

                  {/* PHP Extensions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Required PHP Extensions</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(reqData?.extensions || {}).map(([ext, ok]) => (
                        <div key={ext} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="font-mono text-slate-700 uppercase text-[11px]">{ext}</span>
                          {ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Directory Permissions */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700">Storage & Cache Write Permissions</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {Object.entries(reqData?.permissions || {}).map(([folder, ok]) => (
                        <div key={folder} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="font-mono text-slate-700 text-[11px]">{folder}</span>
                          {ok ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => refetchReq()}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Re-check
                </button>
                <button
                  type="button"
                  disabled={!allReqMet}
                  onClick={() => setStep(2)}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Continue to Database <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATABASE SETUP */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-violet-600" /> Database Connection Setup
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your MySQL or PostgreSQL database details created in cPanel.
                </p>
              </div>

              {dbTestMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    dbTestMessage.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {dbTestMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                  {dbTestMessage.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database Driver</label>
                  <select
                    value={dbDriver}
                    onChange={e => {
                      setDbDriver(e.target.value as any);
                      setDbPort(e.target.value === 'mysql' ? '3306' : '5432');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="mysql">MySQL / MariaDB (cPanel Standard)</option>
                    <option value="pgsql">PostgreSQL</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database Host</label>
                  <input
                    type="text"
                    value={dbHost}
                    onChange={e => setDbHost(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database Port</label>
                  <input
                    type="text"
                    value={dbPort}
                    onChange={e => setDbPort(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database Name</label>
                  <input
                    type="text"
                    value={dbName}
                    onChange={e => setDbName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database Username</label>
                  <input
                    type="text"
                    value={dbUser}
                    onChange={e => setDbUser(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Database Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={dbPass}
                    onChange={e => setDbPass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => testDbMutation.mutate()}
                  disabled={testDbMutation.isPending}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testDbMutation.isPending ? 'animate-spin' : ''}`} /> Test Connection
                </button>
                <button
                  type="button"
                  disabled={!dbTested}
                  onClick={() => setStep(3)}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Configure Admin <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ADMIN & SITE SETUP */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-600" /> Platform & Super Admin Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Create your master Super Admin account and platform brand details.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Platform Brand Name</label>
                    <input
                      type="text"
                      value={appName}
                      onChange={e => setAppName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Site Application URL</label>
                    <input
                      type="url"
                      value={appUrl}
                      onChange={e => setAppUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Super Admin Full Name</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={e => setAdminName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Super Admin Email Address</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Super Admin Password</label>
                    <input
                      type="password"
                      placeholder="At least 8 characters"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Master Organization Name</label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!adminName || !adminEmail || adminPassword.length < 8}
                  onClick={() => setStep(4)}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  Review & Install <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & EXECUTE */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-600" /> Execute Platform Installation
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ready to migrate database, populate tables, create admin, and lock installer.
                </p>
              </div>

              {installError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-red-700">
                    <XCircle className="w-4 h-4" /> Installation Error
                  </div>
                  <div>{installError}</div>
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Database Driver:</span> <span className="font-bold uppercase text-slate-900">{dbDriver}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Database Name:</span> <span className="font-bold text-slate-900">{dbName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Super Admin Email:</span> <span className="font-bold text-slate-900">{adminEmail}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Application Brand:</span> <span className="font-bold text-slate-900">{appName}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={installing}
                onClick={handleStartInstallation}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {installing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" /> Migrating & Seeding Database...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" /> Start Automatic Installation
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 5: INSTALLATION COMPLETE */}
          {step === 5 && (
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Installation Successful!</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Database migrations applied, seeders executed, and Super Admin account initialized.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-mono text-slate-700 text-left space-y-1">
                <div>Admin Login: {adminEmail}</div>
                <div>Installer Status: Locked (storage/installed created)</div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors shadow-md"
                >
                  Launch Platform Home <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors shadow-md"
                >
                  Super Admin Login <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="/reseller"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-colors shadow-md"
                >
                  Reseller Portal <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
