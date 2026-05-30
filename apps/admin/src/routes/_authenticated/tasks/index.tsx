import { useEffect, useState } from 'react'
import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { adminService, type Task } from '@/services/admin'
import { toast } from 'sonner'
import { AppTitle } from '@/components/layout/app-title'
import { TaskSessionsModal } from '@/components/task-sessions-modal'
import { getTasksColumns } from './_components/tasks-columns'
import { TasksTable } from './_components/tasks-table'
import { TasksToolbar } from './_components/tasks-toolbar'

function Tasks() {
  const [data, setData] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [sessionsTask, setSessionsTask] = useState<Task | null>(null)
  const [sessionsOpen, setSessionsOpen] = useState(false)

  useEffect(() => {
    queueMicrotask(() => setLoading(true))

    const params = {}

    adminService
      .listTasks(params)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data.list)
          setTotal(res.data.total)
        } else {
          toast.error(res.error || 'Failed to load tasks')
        }
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }, [])

  function handleViewSessions(task: Task) {
    setSessionsTask(task)
    setSessionsOpen(true)
  }

  const columns = getTasksColumns({ onViewSessions: handleViewSessions })

  return (
    <div className='flex flex-col gap-6'>
      <AppTitle title='Tasks' description='View and manage all tasks.' />

      <TasksToolbar />

      <TasksTable
        data={data}
        columns={columns}
        loading={loading}
        search={{}}
        navigate={() => {}}
        total={total}
      />

      {sessionsTask && (
        <TaskSessionsModal
          taskUuid={sessionsTask.uuid}
          taskTitle={sessionsTask.title}
          open={sessionsOpen}
          onOpenChange={(open) => {
            setSessionsOpen(open)
            if (!open) setSessionsTask(null)
          }}
        />
      )}
    </div>
  )
}

const tasksSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  keyword: z.string().optional().catch(''),
  status: z.string().optional().catch(''),
  user_uuid: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/tasks/')({
  validateSearch: tasksSearchSchema,
  component: Tasks,
})
