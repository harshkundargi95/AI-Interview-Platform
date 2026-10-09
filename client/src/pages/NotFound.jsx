import { EmptyState, PageHeading } from '../components/ui.jsx'

export default function NotFound() {
  return <><PageHeading eyebrow="404 / A small detour" title="This page isn’t here." /><EmptyState title="Let’s get you back on track." to="/" action="Return to overview">The link may be incomplete or the page may have moved. Your next step is a click away.</EmptyState></>
}
