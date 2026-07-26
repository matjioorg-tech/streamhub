export function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-800 bg-zinc-950 py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} StreamHub. All rights reserved.</p>
      </div>
    </footer>
  );
}
