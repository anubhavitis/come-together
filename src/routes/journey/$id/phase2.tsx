import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journey/$id/phase2')({
  component: Phase2Form,
})

function Phase2Form() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Mapping the Territory</h1>
      <p className="mt-2 text-text-secondary">
        Capture the quality of your experience while it's fresh.
      </p>
    </div>
  )
}
