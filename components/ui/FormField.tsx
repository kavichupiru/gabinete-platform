interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  name: string
}

export default function FormField({ label, name, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        {...props}
      />
    </div>
  )
}
