import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journey/$id/phase3/new')({
  component: Phase3New,
})

function Phase3New() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Walking the Path</h1>
      <p className="mt-2 text-text-secondary">
        Reflect on how the experience is settling into your life.
      </p>
    </div>
  )
}
