export default function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-xs font-semibold text-red">
      {message}
    </div>
  );
}
