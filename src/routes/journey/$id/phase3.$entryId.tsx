import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journey/$id/phase3/$entryId')({
  component: Phase3Entry,
})

function Phase3Entry() {
  const { entryId } = Route.useParams()
  return (
    <div>
      <h1 className="text-2xl font-bold">Integration Check-in</h1>
      <p className="mt-2 text-text-secondary">Entry: {entryId}</p>
    </div>
  )
}
