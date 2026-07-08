import { PeriodFormClient } from "../_components/period-form-client";

export const metadata = {
  title: "New period",
};

export default function NewPeriodPage() {
  return <PeriodFormClient mode="create" />;
}
