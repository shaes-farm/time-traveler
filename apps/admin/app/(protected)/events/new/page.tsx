import { EventFormClient } from "../_components/event-form-client";

export const metadata = {
  title: "New event",
};

export default function NewEventPage() {
  return <EventFormClient mode="create" />;
}
