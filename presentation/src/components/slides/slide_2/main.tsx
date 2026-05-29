import { SlideFrame } from "@/components/ui/slide-frame";
import { LayerCard } from "./components/layer-card";
import { layers } from "./data/layers";

export function Slide2() {
  return (
    <SlideFrame
      eyebrow="Agenda"
      title="Three moves. One playbook."
    >
      <div className="grid h-full gap-6 lg:grid-cols-3">
        {layers.map((layer, index) => (
          <LayerCard
            key={layer.title}
            index={index}
            title={layer.title}
            detail={layer.detail}
          />
        ))}
      </div>
    </SlideFrame>
  );
}
