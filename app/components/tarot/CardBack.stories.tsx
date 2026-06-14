import type { Meta, StoryObj } from '@storybook/react';
import CardBack from './CardBack';

const meta: Meta<typeof CardBack> = {
  title: 'Tarot/CardBack',
  component: CardBack,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CardBack>;

export const Default: Story = {
  args: {
    width: 200,
    height: 300,
  },
};

export const Small: Story = {
  args: {
    width: 80,
    height: 120,
  },
};
