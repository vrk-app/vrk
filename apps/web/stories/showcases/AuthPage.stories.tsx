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
              label="Я работаю под своей учетной записью и подтверждаю правила безопасного доступа."
              links={[
                { label: "политикой обработки", href: "#policy" },
                { label: "регламентом входа", href: "#policy" },
              ]}
            />
          }
          submitLabel="Войти в систему"
        />
      }
      subtitle="Экран оставляет только необходимые шаги входа: корпоративную почту, пароль и подтверждение правил доступа."
      title="Смена начинается с контролируемого входа"
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
