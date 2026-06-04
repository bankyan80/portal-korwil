'use client';

import { useState } from 'react';
import { SuperSekolah } from '@/components/admin/SuperSekolah';
import { SimpleAdminLayout } from '@/components/admin/SimpleAdminLayout';
import { ChangePasswordDialog } from '@/components/operator/ChangePasswordDialog';
import { KeyRound } from 'lucide-react';

export default function ProfilSekolahPage() {
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <SimpleAdminLayout>
      {showChangePassword ? (
        <div className="max-w-2xl mx-auto">
          <div className="mb-4">
            <button
              onClick={() => setShowChangePassword(false)}
              className="text-sm text-blue-700 hover:text-blue-500 transition-colors"
            >
              &larr; Kembali ke Profil Sekolah
            </button>
          </div>
          <ChangePasswordDialog onClose={() => setShowChangePassword(false)} />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Profil Sekolah</h2>
            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Ubah Password
            </button>
          </div>
          <SuperSekolah mode="operator" />
        </div>
      )}
    </SimpleAdminLayout>
  );
}

