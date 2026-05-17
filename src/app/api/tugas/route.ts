import { NextRequest, NextResponse } from 'next/server';
import { adminDb, isFirebaseAdminConfigured } from '@/lib/firebase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ success: false, error: 'Firebase Admin tidak dikonfigurasi' }, { status: 500 });
  }

  const token = request.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  try {
    const [groupsSnap, progressSnap] = await Promise.all([
      adminDb.collection('task_groups').orderBy('createdAt', 'desc').get(),
      adminDb.collection('task_progress').get(),
    ]);

    const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const progressList = progressSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const progressByTask: Record<string, any[]> = {};
    for (const p of progressList) {
      const taskId = p.taskGroupId || '';
      if (!progressByTask[taskId]) progressByTask[taskId] = [];
      progressByTask[taskId].push(p);
    }

    const groupsWithProgress = groups.map(g => {
      const taskProgress = progressByTask[g.id] || [];
      const total = taskProgress.length;
      const completed = taskProgress.filter(p => p.status === 'completed').length;
      return {
        ...g,
        progress: { total, completed, pending: total - completed },
        progressList: taskProgress,
      };
    });

    return NextResponse.json({ success: true, groups: groupsWithProgress });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured || !adminDb) {
    return NextResponse.json({ success: false, error: 'Firebase Admin tidak dikonfigurasi' }, { status: 500 });
  }

  const token = req.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin', 'operator_sekolah']);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      const { title, description, targetLink, targetLabel, dueDate, forJenjang } = body;
      if (!title || !targetLink) {
        return NextResponse.json({ success: false, error: 'Title dan targetLink wajib' }, { status: 400 });
      }
      const docRef = await adminDb.collection('task_groups').add({
        title,
        description: description || '',
        targetLink,
        targetLabel: targetLabel || title,
        dueDate: dueDate || null,
        forJenjang: forJenjang || [],
        createdBy: body.createdBy || '',
        createdAt: Date.now(),
        active: true,
      });
      return NextResponse.json({ success: true, id: docRef.id });
    }

    if (action === 'update') {
      const { id, ...data } = body;
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
      await adminDb.collection('task_groups').doc(id).update(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
      await adminDb.collection('task_groups').doc(id).delete();
      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      const { taskId, schoolId, schoolName, notes } = body;
      if (!taskId || !schoolId) {
        return NextResponse.json({ success: false, error: 'taskId dan schoolId wajib' }, { status: 400 });
      }
      const progressId = `${taskId}_${schoolId}`;
      const existing = await adminDb.collection('task_progress').doc(progressId).get();
      if (existing.exists()) {
        await adminDb.collection('task_progress').doc(progressId).update({
          status: 'completed',
          completedAt: Date.now(),
          notes: notes || '',
        });
      } else {
        await adminDb.collection('task_progress').doc(progressId).set({
          taskGroupId: taskId,
          schoolId,
          schoolName: schoolName || '',
          status: 'completed',
          completedAt: Date.now(),
          notes: notes || '',
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'get-operator') {
      const { schoolId, schoolName } = body;
      if (!schoolId && !schoolName) {
        return NextResponse.json({ success: false, error: 'schoolId atau schoolName diperlukan' }, { status: 400 });
      }

      const [groupsSnap, progressSnap] = await Promise.all([
        adminDb.collection('task_groups').where('active', '==', true).get(),
        adminDb.collection('task_progress').get(),
      ]);

      const groups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allProgress = progressSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const schoolProgress = allProgress.filter(p =>
        p.schoolId === schoolId || p.schoolName === schoolName
      );
      const completedIds = new Set(schoolProgress.filter(p => p.status === 'completed').map(p => p.taskGroupId));

      const tasks = groups.map(g => ({
        ...g,
        completed: completedIds.has(g.id),
        completedAt: schoolProgress.find(p => p.taskGroupId === g.id)?.completedAt || null,
      }));

      return NextResponse.json({ success: true, tasks });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
