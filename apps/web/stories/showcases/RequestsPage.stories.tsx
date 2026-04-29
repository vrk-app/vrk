import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Search } from "lucide-react";
import { RequestList } from "@/entities/Request";
import {
  REQUEST_BREADCRUMBS,
  REQUEST_FILTER_CHIPS,
  REQUEST_LIST_ITEMS,
  SHELL_FOOTER_ITEMS,
  SHELL_NAV_ITEMS,
  SHELL_USER,
} from "@/shared/storybook/fixtures";
import { Badge, Button, Card, InputField } from "@/shared/ui";
import { AppShell, PageHeader, SidebarNav, TopBar } from "@/widgets/OperatorShell";

const REQUESTS_PAGE_PAGE_SIZE = 2;

function RequestsPageShowcase() {
  const [page, setPage] = useState(1);
  const total = REQUEST_LIST_ITEMS.length;
  const totalPages = Math.max(1, Math.ceil(total / REQUESTS_PAGE_PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const pageStart = (currentPage - 1) * REQUESTS_PAGE_PAGE_SIZE;
  const pageItems = REQUEST_LIST_ITEMS.slice(pageStart, pageStart + REQUESTS_PAGE_PAGE_SIZE);

  return (
    <AppShell
      header={
        <TopBar
          breadcrumbs={REQUEST_BREADCRUMBS}
          notificationsCount={6}
          searchValue="VRK-24"
          user={SHELL_USER}
        />
      }
      sidebar={
        <SidebarNav activeKey="requests" footerItems={SHELL_FOOTER_ITEMS} items={SHELL_NAV_ITEMS} />
      }
    >
      <PageHeader
        actions={
          <>
            <Button variant="secondary">Экспорт списка</Button>
            <Button>Создать заявку</Button>
          </>
        }
        subtitle="Поиск, фильтры и статусы помогают быстро выбрать заявку для обработки."
        title="Оперативный список заявок"
      />

      <Card className="gap-4" padding="lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-4 xl:flex-1">
            <InputField
              autoComplete="off"
              label="Поиск по списку"
              leftIcon={<Search className="size-4" />}
              name="request-search"
              placeholder="Номер заявки, подрядчик, оборудование…"
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-2">
              {REQUEST_FILTER_CHIPS.map((chip) => (
                <Badge
                  className="whitespace-nowrap"
                  icon={<chip.icon className="size-4" />}
                  key={chip.label}
                  tone="neutral"
                >
                  {chip.label}
                </Badge>
              ))}
            </div>
          </div>
          <Button className="shrink-0" variant="secondary">
            Сбросить фильтры
          </Button>
        </div>
      </Card>

      <RequestList
        items={pageItems}
        onPageChange={setPage}
        page={page}
        pageSize={REQUESTS_PAGE_PAGE_SIZE}
        total={total}
      />
    </AppShell>
  );
}

const meta = {
  title: "Showcases/RequestsPage",
  component: RequestsPageShowcase,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof RequestsPageShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {};
