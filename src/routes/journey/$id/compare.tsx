import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journey/$id/compare')({
  component: ComparisonView,
})

function ComparisonView() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Your Journey — Before & After</h1>
      <p className="mt-2 text-text-secondary">
        See how your inner landscape has shifted.
      </p>
    </div>
  )
}
