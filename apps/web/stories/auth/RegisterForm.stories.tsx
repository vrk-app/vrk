import type { Meta, StoryObj } from "@storybook/react";
import { RegisterForm } from "@/features/AuthRegister";
import { ConsentRow } from "@/widgets/Auth";

const consent = (
  <ConsentRow
    defaultChecked
    label="Я принимаю политику доступа VRK."
    links={[{ label: "политикой доступа", href: "/access-policy" }]}
  />
);

const meta = {
  title: "Auth/RegisterForm",
  component: RegisterForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    consent,
  },
  render: (args) => (
    <div className="w-full max-w-[620px]">
      <RegisterForm {...args} />
    </div>
  ),
} satisfies Meta<typeof RegisterForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ValidationError: Story = {
  args: {
    formError: "Заполните рабочую почту и контактное лицо.",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
