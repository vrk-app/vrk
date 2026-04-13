import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState, type ComponentProps } from "react";
import { REQUEST_LIST_ITEMS } from "@/shared/storybook/fixtures";
import { RequestList } from "@/entities/Request";

const manyItems = Array.from({ length: 8 }).flatMap((_, index) =>
  REQUEST_LIST_ITEMS.map((item) => ({
    ...item,
    requestNumber: `${item.requestNumber}-${index + 1}`,
  })),
);

const meta = {
  title: "Requests/RequestList",
  component: RequestList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    items: REQUEST_LIST_ITEMS,
    page: 1,
    pageSize: 10,
    total: REQUEST_LIST_ITEMS.length,
  },
} satisfies Meta<typeof RequestList>;

export default meta;

type Story = StoryObj<typeof meta>;

function clampPage(page: number, pageSize: number, total: number) {
  const safePageSize = Math.max(1, pageSize);
  const safeTotal = Math.max(0, total);
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));

  return Math.min(Math.max(page, 1), totalPages);
}

function ControlledRequestListStory(args: ComponentProps<typeof RequestList>) {
  const [page, setPage] = useState(args.page);

  useEffect(() => {
    setPage(args.page);
  }, [args.page, args.items, args.pageSize, args.total]);

  const safePageSize = Math.max(1, args.pageSize);
  const currentPage = clampPage(page, args.pageSize, args.total);
  const pageStart = (currentPage - 1) * safePageSize;
  const pageItems = args.loading || args.empty ? args.items : args.items.slice(pageStart, pageStart + safePageSize);

  return <RequestList {...args} items={pageItems} onPageChange={setPage} page={page} />;
}

export const Default: Story = {
  render: (args) => <ControlledRequestListStory {...args} />,
};

export const Loading: Story = {
  render: (args) => <ControlledRequestListStory {...args} />,
  args: {
    loading: true,
  },
};

export const Empty: Story = {
  render: (args) => <ControlledRequestListStory {...args} />,
  args: {
    empty: true,
    items: [],
    total: 0,
  },
};

export const DerivedEmptyFromTotal: Story = {
  render: (args) => <ControlledRequestListStory {...args} />,
  args: {
    items: [],
    total: 0,
  },
};

export const ManyItems: Story = {
  render: (args) => <ControlledRequestListStory {...args} />,
  args: {
    items: manyItems,
    total: manyItems.length,
  },
};

export const OutOfRangePage: Story = {
  render: (args) => <ControlledRequestListStory {...args} />,
  args: {
    items: manyItems,
    page: 99,
    total: manyItems.length,
  },
};
