import { ServiceBadge } from "../ServiceBadge";

export default function ServiceBadgeExample() {
  return (
    <div className="p-8 flex flex-wrap gap-3">
      <ServiceBadge service="inwi" />
      <ServiceBadge service="orange" />
      <ServiceBadge service="maroc-telecom" />
      <ServiceBadge service="water" />
      <ServiceBadge service="gas" />
      <ServiceBadge service="electricity" />
    </div>
  );
}
