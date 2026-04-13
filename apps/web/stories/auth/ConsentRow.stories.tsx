import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ConsentRow, type ConsentRowProps } from "@/widgets/Auth";

function ControlledConsentRow(args: ConsentRowProps) {
  const [checked, setChecked] = useState(Boolean(args.checked ?? args.defaultChecked));

  useEffect(() => {
    setChecked(Boolean(args.checked ?? args.defaultChecked));
  }, [args.checked, args.defaultChecked]);

  return (
    <ConsentRow
      {...args}
      checked={checked}
      onChange={(event) => {
        args.onChange?.(event);
      }}
      onCheckedChange={(nextChecked, event) => {
        setChecked(nextChecked);
        args.onCheckedChange?.(nextChecked, event);
      }}
    />
  );
}

const meta = {
  title: "Auth/ConsentRow",
  component: ConsentRow,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    checked: false,
    label: "Я подтверждаю использование корпоративных данных и согласен(на) с правилами доступа.",
    links: [
      { label: "политикой обработки", href: "#policy" },
      { label: "регламентом входа", href: "#policy" },
    ],
  },
  render: (args) => (
    <div className="w-[420px] rounded-[var(--radius-xl)] border border-border bg-card p-5 shadow-xs">
      <ControlledConsentRow {...args} />
    </div>
  ),
} satisfies Meta<typeof ConsentRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Error: Story = {
  args: {
    error: "Нужно подтвердить согласие перед входом.",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
