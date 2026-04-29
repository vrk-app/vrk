import type { Meta, StoryObj } from "@storybook/react";
import { AuthSplitLayout, ConsentRow, LoginForm } from "@/widgets/Auth";

function AuthPageShowcase() {
  return (
    <AuthSplitLayout
      illustrationSlot={null}
      formSlot={
        <LoginForm
          consent={
            <ConsentRow
              defaultChecked
              label="Я принимаю политику доступа VRK."
              links={[{ label: "политикой доступа", href: "/access-policy" }]}
            />
          }
          submitLabel="Войти"
        />
      }
      subtitle="Используйте корпоративную почту и пароль, выданные для работы в VRK."
      title="Вход в VRK"
    />
  );
}

const meta = {
  title: "Showcases/AuthPage",
  component: AuthPageShowcase,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AuthPageShowcase>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {};
