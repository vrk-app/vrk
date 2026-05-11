import { ArrowLeft } from "lucide-react";
import { EquipmentCardVariantGallery } from "@/features/Stage03Equipment";
import { Badge, buttonVariants } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

export default function EquipmentCardVariantsPage() {
  return (
    <>
      <PageHeader
        actions={
          <>
            <Badge tone="info">Оборудование</Badge>
            <a className={`${buttonVariants({ variant: "secondary" })} touch-manipulation`} href="/equipment">
              <ArrowLeft aria-hidden="true" className="size-4" />
              Вернуться в реестр
            </a>
          </>
        }
        subtitle="5 паспортных вариантов карточки оборудования без сетевых запросов и мутаций."
        title="Варианты карточек реестра"
      />

      <EquipmentCardVariantGallery />
    </>
  );
}
