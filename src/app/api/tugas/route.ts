import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseAdminConfigured } from '@/lib/supabase-admin';
import { verifyCookieAuth, requireRole } from '@/lib/server-auth';

async function getGroups() {
  const { data, error } = await supabaseAdmin!
    .from('app_data')
    .select('*')
    .eq('collection', 'task_groups')
    .order('data->>createdAt', { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({ id: r.id, ...(r.data as object) }));
}

async function getProgress() {
  const { data, error } = await supabaseAdmin!
    .from('app_data')
    .select('*')
    .eq('collection', 'task_progress');
  if (error) throw error;
  return (data || []).map(r => ({ id: r.id, ...(r.data as object) }));
}

async function setDoc(collection: string, id: string, data: any) {
  const { error } = await supabaseAdmin!
    .from('app_data')
    .upsert({ id, collection, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function deleteDoc(collection: string, id: string) {
  const { error } = await supabaseAdmin!
    .from('app_data')
    .delete()
    .eq('collection', collection)
    .eq('id', id);
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Database tidak dikonfigurasi' }, { status: 500 });
  }

  const token = request.cookies.get('auth-token')?.value;
  const auth = await verifyCookieAuth(token || '');
  const forbidden = requireRole(auth, ['super_admin']);
  if (forbidden) return forbidden;

  try {
    const [groups, progressList] = await Promise.all([getGroups(), getProgress()]);

    const progressByTask: Record<string, any[]> = {};
    for (const p of progressList) {
      const taskId = (p as any).taskGroupId || '';
      if (!progressByTask[taskId]) progressByTask[taskId] = [];
      progressByTask[taskId].push(p);
    }

    const groupsWithProgress = groups.map(g => {
      const taskProgress = progressByTask[(g as any).id] || [];
      const total = taskProgress.length;
      const completed = taskProgress.filter(p => (p as any).status === 'completed').length;
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
  if (!isSupabaseAdminConfigured() || !supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Database tidak dikonfigurasi' }, { status: 500 });
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
      const id = crypto.randomUUID();
      await setDoc('task_groups', id, {
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
      return NextResponse.json({ success: true, id });
    }

    if (action === 'update') {
      const { id, ...data } = body;
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
      await setDoc('task_groups', id, { ...data, updatedAt: Date.now() });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
      await deleteDoc('task_groups', id);
      return NextResponse.json({ success: true });
    }

    if (action === 'complete') {
      const { taskId, schoolId, schoolName, notes } = body;
      if (!taskId || !schoolId) {
        return NextResponse.json({ success: false, error: 'taskId dan schoolId wajib' }, { status: 400 });
      }
      const progressId = `${taskId}_${schoolId}`;
      const { data: existing } = await supabaseAdmin
        .from('app_data')
        .select('*')
        .eq('collection', 'task_progress')
        .eq('id', progressId)
        .single();
      if (existing) {
        await setDoc('task_progress', progressId, {
          ...(existing.data as object),
          status: 'completed',
          completedAt: Date.now(),
          notes: notes || '',
          updatedAt: Date.now(),
        });
      } else {
        await setDoc('task_progress', progressId, {
          taskGroupId: taskId,
          schoolId,
          schoolName: schoolName || '',
          status: 'completed',
          completedAt: Date.now(),
          notes: notes || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'get-operator') {
      const { schoolId, schoolName } = body;
      if (!schoolId && !schoolName) {
        return NextResponse.json({ success: false, error: 'schoolId atau schoolName diperlukan' }, { status: 400 });
      }

      const [groups, allProgress] = await Promise.all([getGroups(), getProgress()]);
      const activeGroups = groups.filter((g: any) => g.active !== false);
      const schoolProgress = allProgress.filter((p: any) =>
        p.schoolId === schoolId || p.schoolName === schoolName
      );
      const completedIds = new Set(schoolProgress.filter((p: any) => p.status === 'completed').map((p: any) => p.taskGroupId));

      const tasks = activeGroups.map(g => ({
        ...g,
        completed: completedIds.has((g as any).id),
        completedAt: (schoolProgress as any[]).find((p: any) => p.taskGroupId === (g as any).id)?.completedAt || null,
      }));

      return NextResponse.json({ success: true, tasks });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
