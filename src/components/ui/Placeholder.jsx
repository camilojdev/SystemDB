export default function Placeholder({ titulo }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-heading">{titulo}</h2>
        <p className="text-muted mt-2">Módulo en construcción</p>
      </div>
    </div>
  )
}