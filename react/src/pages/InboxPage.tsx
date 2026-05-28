import { Nav } from 'components/Nav';

export function InboxPage() {
  return (
    <div className="flex justify-center gap-8">
      <Nav />

      <div className="flex flex-1 flex-col items-center gap-20 p-8">
        <h1 className="mt-8 text-2xl font-bold text-white">Inbox</h1>
        <p className="text-sm text-slate-400">TODO</p>
      </div>
    </div>
  );
}
