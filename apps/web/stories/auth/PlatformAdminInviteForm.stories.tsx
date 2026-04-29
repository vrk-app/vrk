import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { PlatformAdminInviteForm } from "@/features/Stage03Bootstrap";
import { withRuntimeApi } from "@/shared/storybook/runtime-api-mock";

const authFrame: Decorator = (Story) => (
  <div className="story-shell">
    <div className="mx-auto w-full max-w-[620px]">{Story()}</div>
  </div>
);

const meta = {
  title: "Auth/PlatformAdminInviteForm",
  component: PlatformAdminInviteForm,
  decorators: [authFrame],
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof PlatformAdminInviteForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [withRuntimeApi()],
};

export const Error: Story = {
  decorators: [withRuntimeApi({ failurePaths: ["/api/platform/organization-shells"] })],
};
